import express from 'express';
import { createReportQueue, createReportStore, requestGenerateReport } from './reports.js';
import assert from 'assert';
import cors from 'cors';
import mongoose from 'mongoose';
import { Report, PingReport, Traceroute, Security, Rep } from './schemas.js';
import { scheduleReportGeneration } from './scheduler.js';
import { performSSLCheck, getCoordinates } from './network.js';

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
/**
 * @constant {string} MONGO_URI - The URI for connecting to MongoDB.
 */
const MONGO_URI = 'mongodb://localhost:27017/report';

mongoose.connect(MONGO_URI, {});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Initialize application locals for report store and queue
app.locals.store = createReportStore();
app.locals.queue = createReportQueue(app.locals.store);
app.locals.Report = Report;

/**
 * Handles POST requests to create and schedule reports for a list of URLs.
 * 
 * @name POST /report
 * @function
 * @param {express.Request} request - The request object, containing an array of URLs and options.
 * @param {express.Response} response - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * 
 * @returns {Promise<void>} Resolves with an array of report IDs or rejects with an error.
 */
app.post('/report', express.json(), (request, response, next) => {
    if (!Array.isArray(request.body)) {
        console.error('Bad request: Expected an array');
        return response.sendStatus(400);
    }
    Promise.all(
        request.body.map(async ({ url, options }) => {
            assert(typeof url === 'string', 'Expected url to be provided');
            scheduleReportGeneration(url, request.app.locals.store, request.app.locals.queue);
            return [
                url,
                await requestGenerateReport(
                    request.app.locals.store,
                    request.app.locals.queue,
                    url,
                    options
                ),
            ];
        })
    )
    .then(identifiers => response.send(identifiers))
    .catch(error => {
        console.error('Error processing request:', error);
        next(error);
    });
});

/**
 * Retrieves a report for a given URL.
 * 
 * @name GET /report/:url
 * @function
 * @param {express.Request} req - The request object, containing the URL parameter.
 * @param {express.Response} res - The response object.
 * 
 * @returns {Promise<void>} Resolves with the report data or rejects with an error.
 */
app.get('/report/:url', async (req, res) => {
    const { url } = req.params;
    try {
        // Fetch the performance metrics from the Report collection
        const report = await Report.findOne({ url }).exec();
        // Fetch the diagnostics from the Rep collection
        const rep = await Rep.findOne({ url }).exec();

        if (report && rep) {
            // Extract performance metrics
            const mobile = { ...report.performanceMetrics.mobile };
            const desktop = { ...report.performanceMetrics.desktop };

            // Add diagnostics to the performance metrics
            mobile.diagnostics = rep.mobileDiagnostics || [];
            desktop.diagnostics = rep.desktopDiagnostics || [];

            // Construct the final performanceMetrics object
            const finalPerformanceMetrics = {
                mobile,
                desktop
            };

            // Respond with the final object containing performance metrics and diagnostics
            return res.json({ ...report._doc, performanceMetrics: finalPerformanceMetrics });
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});


/**
 * Retrieves a ping report for a given URL.
 * 
 * @name GET /ping/:url
 * @function
 * @param {express.Request} req - The request object, containing the URL parameter.
 * @param {express.Response} res - The response object.
 * 
 * @returns {Promise<void>} Resolves with the ping report data or rejects with an error.
 */
app.get('/ping/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await PingReport.findOne({ url }).exec();
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Retrieves a traceroute report for a given URL.
 * 
 * @name GET /trace/:url
 * @function
 * @param {express.Request} req - The request object, containing the URL parameter.
 * @param {express.Response} res - The response object.
 * 
 * @returns {Promise<void>} Resolves with the traceroute report data or rejects with an error.
 */
app.get('/trace/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Traceroute.findOne({ url }).exec();
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/coord/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Traceroute.findOne({ url }).exec();
        if (report) {
            // Extract IP addresses from the report
            const hops = report.tracerouteData;
            
            // Create promises to get coordinates for each IP address
            const coordinatePromises = hops.map(async (hop) => {
                const { ipAddress } = hop;
                
                if (isPrivateIP(ipAddress)) {
                    // Return null coordinates for private IP addresses
                    return [null, null];
                }
                
                try {
                    const { coordinates } = await getCoordinates(ipAddress);
                    return coordinates ? [coordinates.latitude, coordinates.longitude] : [null, null];
                } catch (error) {
                    // Log error if needed
                    console.error(`Error fetching coordinates for IP ${ipAddress}:`, error.message);
                    return [null, null]; // Return default coordinates on error
                }
            });

            // Wait for all coordinate lookups to complete
            const coordinatesList = await Promise.all(coordinatePromises);
            return res.json(coordinatesList); // Return the list of coordinates
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});


const isPrivateIP = (ip) => {
    const parts = ip.split('.').map(Number);
    return (
        (parts[0] === 10) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)
    );
};


/**
 * Performs an SSL check on a given URL.
 * 
 * @name GET /SSL/:url
 * @function
 * @param {express.Request} req - The request object, containing the URL parameter.
 * @param {express.Response} res - The response object.
 * 
 * @returns {Promise<void>} Resolves with the SSL check result or rejects with an error.
 */
app.get('/SSL/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await performSSLCheck(url);
        if (report) {
            return res.json(report);
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Retrieves a security report for a given URL.
 * 
 * @name GET /security/:url
 * @function
 * @param {express.Request} req - The request object, containing the URL parameter.
 * @param {express.Response} res - The response object.
 * 
 * @returns {Promise<void>} Resolves with the security report data or rejects with an error.
 */
app.get('/security/:url', async (req, res) => {
    const { url } = req.params;
    try {
        const report = await Security.findOne({ url }).exec();
        if (report) {
            return res.json(report); 
        } else {
            res.status(404).send('Report not found');
        }
    } catch (error) {
        console.error(`Error fetching report [${url}]:`, error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Deletes a report by its ID.
 * 
 * @name DELETE /report/:id
 * @function
 * @param {express.Request} request - The request object, containing the report ID.
 * @param {express.Response} response - The response object.
 * @param {express.NextFunction} next - The next middleware function.
 * 
 * @returns {Promise<void>} Resolves with a status code indicating success or failure.
 */
app.delete('/report/:id', (request, response, next) => {
    const key = `report:${request.params.id}`;
    request.app.locals.store
        .get(key)
        .then(report => {
            if (!report) {
                return response.sendStatus(404); 
            }
            return app.locals.store.del(key).then(() => response.sendStatus(204)); 
        })
        .catch(next); 
});

/**
 * Serves the index.html file for the root URL.
 * 
 * @name GET /
 * @function
 * @param {express.Request} request - The request object.
 * @param {express.Response} response - The response object.
 * 
 * @returns {void} Sends the index.html file to the client.
 */
app.get('/', (request, response) => response.sendFile(`${process.cwd()}/index.html`));

/**
 * Sets the server port based on environment variables or defaults to 8080.
 * 
 * @function
 * @returns {number} The port number for the server.
 */
const port = (() => {
    if (/^\d+$/.test(process.env.PORT)) {
        return +process.env.PORT;
    }
    return 8080;
})();

// Start the server and listen for requests
/**
 * Starts the Express server and listens on the specified port.
 * 
 * @function
 */
const server = app.listen(port, () => console.log(`Listening on port ${port}`));

// Graceful shutdown of the server
/**
 * Gracefully shuts down the server and closes the MongoDB connection.
 * 
 * @function
 */
function shutdown() {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Closed remaining connections.');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    });
}

// Listen for termination signals to trigger shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
