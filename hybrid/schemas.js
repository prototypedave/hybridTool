import mongoose from 'mongoose';

// Define the schema for each metric
/**
 * Schema defining the structure for individual performance metrics.
 * 
 * @property {Number} value - The numerical value of the metric.
 * @property {Number} time - The timestamp (in milliseconds) when the metric was recorded.
 * 
 * @type {mongoose.Schema}
 */
const metricSchema = new mongoose.Schema({
    value: { type: Number, required: true },
    time: { type: Number, required: true },
});

/**
 * Schema defining performance metrics for both mobile and desktop.
 * Includes key metrics such as FCP, SI, LCP, TBT, CLS, and total performance score.
 * 
 * @type {mongoose.Schema}
 */
const performanceMetricsSchema = new mongoose.Schema({
    mobile: {
        fcp: { type: metricSchema, required: true },
        si: { type: metricSchema, required: true },
        lcp: { type: metricSchema, required: true },
        tbt: { type: metricSchema, required: true },
        cls: { type: metricSchema, required: true },
        totalPerformance: { type: Number, required: true },
        
    },
    desktop: {
        fcp: { type: metricSchema, required: true },
        si: { type: metricSchema, required: true },
        lcp: { type: metricSchema, required: true },
        tbt: { type: metricSchema, required: true },
        cls: { type: metricSchema, required: true },
        totalPerformance: { type: Number, required: true },

    }
});

/**
 * Schema defining a performance report associated with a specific URL.
 * Each report stores performance metrics for both mobile and desktop.
 * 
 * @type {mongoose.Schema}
 */
const reportSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },  // URL is unique
    performanceMetrics: { type: performanceMetricsSchema, required: true },
    timestamp: { type: Date, default: Date.now }
});

/**
 * Mongoose model for performance reports.
 * 
 * @type {mongoose.Model}
 */
export const Report = mongoose.model('Report', reportSchema);

// Define the schema for ping results
/**
 * Schema for storing ping results associated with a specific URL.
 * Includes metrics such as host, alive status, time, min, max, avg, and packet loss.
 * 
 * @type {mongoose.Schema}
 */
const pingSchema = new mongoose.Schema({
    host: { type: String, required: true },
    alive: { type: Boolean, required: true },
    time: { type: Number }, 
    min: { type: Number },  
    max: { type: Number },  
    avg: { type: Number },  
    packetLoss: { type: String }, 
}, { timestamps: true });

/**
 * Schema defining ping metrics for a URL.
 * 
 * @type {mongoose.Schema}
 */
const pingMetricsSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },  
    pingMetrics: { type: pingSchema, required: true }
});

/**
 * Mongoose model for storing ping reports.
 * 
 * @type {mongoose.Model}
 */
export const PingReport = mongoose.model('Ping', pingMetricsSchema);

// Define the schema for a single hop in the traceroute
/**
 * Schema for a single hop in a traceroute, storing hop number, IP address, and latency.
 * 
 * @type {mongoose.Schema}
 */
const HopSchema = new mongoose.Schema({
    hopNumber: { type: Number, required: true },
    ipAddress: { type: String, required: true },
    latency: { type: Number, required: true }
});

// Define the schema for the entire traceroute associated with a URL
/**
 * Schema for storing traceroute data associated with a specific URL.
 * Includes an array of hops and a timestamp.
 * 
 * @type {mongoose.Schema}
 */
const TracerouteSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    tracerouteData: { type: [HopSchema], required: true },
    timestamp: { type: Date, default: Date.now }
});

/**
 * Mongoose model for storing traceroute data.
 * 
 * @type {mongoose.Model}
 */
export const Traceroute = mongoose.model('Traceroute', TracerouteSchema);

// Define the schema for tags associated with alerts
/**
 * Schema for storing tags related to OWASP vulnerabilities.
 * 
 * @type {mongoose.Schema}
 */
const tagSchema = new mongoose.Schema({
    OWASP_2021_A05: { type: String },
    OWASP_2017_A06: { type: String }
});

// Define the schema for alerts within security reports
/**
 * Schema for storing security alerts including metadata like risk, description, evidence, and CWE/WASC IDs.
 * 
 * @type {mongoose.Schema}
 */
const alertsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    risk: { type: String, required: true },
    description: { type: String, required: true },
    confidence: { type: String, required: true },
    evidence: { type: String, required: true },
    solution: { type: String, required: true },
    reference: { type: String, required: true },
    attacks: { type: String },
    cweid: { type: Number, required: true },
    wascid: { type: Number, required: true },
    alertRef: { type: String, required: true },
    tags: { type: tagSchema }
});

// Define the schema for the security report
/**
 * Schema for storing security reports for a URL.
 * Includes an array of alerts and a timestamp.
 * 
 * @type {mongoose.Schema}
 */
const securitySchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    alerts: { type: [alertsSchema], required: true },
    timestamp: { type: Date, default: Date.now }
});

/**
 * Mongoose model for storing security reports.
 * 
 * @type {mongoose.Model}
 */
export const Security = mongoose.model('Security', securitySchema);

/**
 * Saves or updates a document in MongoDB.
 * Finds a document by query, updates it with new data, and saves the timestamp.
 * If the document does not exist, it will be created.
 * 
 * @async
 * @param {mongoose.Model} model - The Mongoose model to update.
 * @param {Object} query - The query object used to find the document.
 * @param {Object} update - The update object with new data to save.
 * 
 * @throws Will throw an error if the save operation fails.
 * 
 * @returns {Promise<void>}
 */
export async function Save(model, query, update) {
    try {
        await model.findOneAndUpdate(
            query,
            { $set: { alerts: update, timestamp: new Date() } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error saving to MongoDB:`, error);
        throw error;
    }
}

const headingSchema = new mongoose.Schema({
    name: String, // Add necessary fields based on the heading structure
    value: String
  });
  
  const itemSchema = new mongoose.Schema({
    name: String, // Add necessary fields based on the item structure
    value: String
  });
  
  // Define the main schema for diagnostics
  const diagnosticSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    info: String,
    link: String,
    metrics: String,
    level: Number,
    savings: String, // Use String because savings includes text like 'ms'
    headings: [headingSchema],  // This will hold an array of heading objects
    items: [itemSchema]  // This will hold an array of item objects
  });
  
  // Define schema for storing diagnostics in a collection (e.g., for a report or user)
  const repSchema = new mongoose.Schema({
    url: { type: String, required: true, unique: true },
    mobileDiagnostics: [diagnosticSchema],  // Array of diagnostic objects
    desktopDiagnostics: [diagnosticSchema]  // Array of diagnostic objects
  });
  
  // Create the models
  export const Rep = mongoose.model('Rep', repSchema);

export async function saveDiagnostics(mobile, desktop, url) {
    const query = { url: url };  // Find a report by reportId or use another unique identifier
    const update = {
        $set: { mobileDiagnostics: mobile, desktopDiagnostics: desktop }
    };

    await handleSave(Rep, query, update);
    console.log('Diagnostics saved or updated successfully.');
}

async function handleSave(model, query, update) {
    try {
        await model.findOneAndUpdate(query, update, { upsert: true, new: true });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        throw error;
    }
}
