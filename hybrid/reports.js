import levelup from "levelup";
import leveldown from "leveldown";
import assert from "assert";
import { getSharedBrowser, createReportWithBrowser } from "./lighthouse-util.js";
import Jobs from "level-jobs";
import { v4 as uuidv4 } from 'uuid';
import { Mutex } from 'async-mutex';
import { Report, PingReport } from './schemas.js';
import { performPing, traceRoute } from "./network.js";
import { SecurityScan } from "./security.js";

const urlMutex = new Mutex();
const storeMutex = new Mutex();

/**
 * Creates a LevelDB-backed report store.
 * @returns {Object} A LevelDB instance to store reports.
 */
export function createReportStore() {
    const database = leveldown("./store");
    return levelup(database);
}

/**
 * Saves a performance report to LevelDB.
 * @async
 * @param {Object} store - The LevelDB store instance.
 * @param {Object} payload - The payload containing report data.
 * @param {Object} performanceMetrics - The performance metrics to store.
 * @returns {Promise<void>}
 * @throws {Error} If saving to LevelDB fails.
 */
async function handleReportSave(store, payload, performanceMetrics) {
    try {
        const levelDocument = Object.assign({}, payload, { performanceMetrics });
        await store.put(payload.id, JSON.stringify(levelDocument));
        console.log(`Report saved to LevelDB with id: ${payload.id}`);
    } catch (error) {
        console.error('Error saving to LevelDB:', error);
        throw error;
    }
}

/**
 * Saves a report to MongoDB.
 * @async
 * @param {Object} model - The Mongoose model.
 * @param {Object} query - The query object to identify the document.
 * @param {Object} update - The update data to be saved.
 * @returns {Promise<void>}
 * @throws {Error} If saving to MongoDB fails.
 */
async function handleMongoSave(model, query, update) {
    try {
        await model.findOneAndUpdate(query, update, { upsert: true, new: true });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}

/**
 * Performs the report generation work, including performance analysis and saving results to LevelDB and MongoDB.
 * @async
 * @param {Object} store - The LevelDB store instance.
 * @param {Object} payload - The payload containing the report request data.
 * @returns {Promise<void>}
 * @throws {Error} If report generation or saving fails.
 */
async function doReportWork(store, payload) {
    assert(payload.id, "Expected payload to have an id");
    assert(payload.url, "Expected payload to have a url");

    try {
        const browser = await getSharedBrowser();

        const [reportResult, pingResult] = await Promise.all([
            createReportWithBrowser(browser, payload.url),
            performPing(payload.url),
            traceRoute(payload.url),
            SecurityScan(payload.url),
        ]);

        const { performanceMetrics } = reportResult;
        const { pingMetrics, error: pingError } = pingResult;

        if (pingError) {
            throw new Error(`Ping error: ${pingError}`);
        }
        
        await handleReportSave(store, payload, performanceMetrics);
        await handleMongoSave(Report, { url: payload.url }, { performanceMetrics });
        await handleMongoSave(PingReport, { url: payload.url }, { pingMetrics });

        console.log(`Report saved to MongoDB with url: ${payload.url}`);

    } catch (error) {
        console.error('Error in doReportWork:', error);
        throw error;
    }
}

/**
 * Creates a report worker function to process jobs from a job queue.
 * @param {Object} store - The LevelDB store instance.
 * @returns {Function} The report worker function.
 */
function createReportWorker(store) {
    return (unused, payload, callback) => {
        doReportWork(store, payload)
            .then(
                () => callback(),
                (error) => callback(error)
            );
    };
}

/**
 * Creates a job queue for generating reports.
 * @param {Object} store - The LevelDB store instance.
 * @returns {Object} The job queue instance.
 */
export function createReportQueue(store) {
    const options = {
        maxConcurrency: 1
    };
    return Jobs(store, createReportWorker(store), options);
}

/**
 * Requests the generation of a new report for a given URL and stores the report request in LevelDB.
 * @async
 * @param {Object} store - The LevelDB store instance.
 * @param {Object} queue - The job queue instance.
 * @param {string} url - The URL for which the report will be generated.
 * @param {Object} [options] - Optional settings for report generation.
 * @param {string} [options.output="html"] - The output format of the report (e.g., "html").
 * @param {string} [options.emulatedFormFactor="mobile"] - The emulated form factor (e.g., "mobile").
 * @returns {Promise<string>} The ID of the generated report.
 * @throws {Error} If report generation request fails.
 */
export async function requestGenerateReport(store, queue, url, options = { output: "html", emulatedFormFactor: 'mobile' }) {
    return urlMutex.runExclusive(async () => {
        let existingReport = null;

        if (existingReport) {
            return existingReport.id;
        }

        const id = `report:${uuidv4()}`;
        const document = { id, url, options };

        await storeMutex.runExclusive(async () => {
            await store.put(id, JSON.stringify(document));
        });

        await new Promise((resolve, reject) => 
            queue.push(document, error => error ? reject(error) : resolve())
        );
        return id;
    });
}
