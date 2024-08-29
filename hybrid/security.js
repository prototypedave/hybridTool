import ZapClient from 'zaproxy';
import { Security, Save } from './schemas.js';

// Configuration options for the ZAP client
/**
 * @typedef {Object} ZapOptions
 * @property {string} apiKey - The API key used for authentication.
 * @property {Object} proxy - The proxy settings for ZAP communication.
 * @property {string} proxy.host - The host of the proxy server.
 * @property {number} proxy.port - The port of the proxy server.
 */

/**
 * Options used to configure the ZAP client.
 * 
 * @type {ZapOptions}
 */
const zapOptions = {
    apiKey: '9203935709',
    proxy: {
        host: 'localhost',
        port: 8081
    }
};

// Create a ZAP client instance
const zap = new ZapClient(zapOptions);

/**
 * Performs a security scan using OWASP ZAP, including a spider scan and an active scan,
 * and processes the results to save them to a MongoDB collection.
 * 
 * @async
 * @function SecurityScan
 * @param {string} targetUrl - The target URL to scan.
 * 
 * @throws Will throw an error if any step of the ZAP scan fails.
 * 
 * @returns {Promise<void>} Resolves when the scan completes and data is saved to the database, or logs an error.
 */
export async function SecurityScan(targetUrl) {
    try {
        // Start a spider scan on the target URL
        const spiderResponse = await zap.spider.scan({ url: targetUrl });
        const scanId = spiderResponse.scan;
        
        let spiderStatus;
        // Wait for the spider scan to complete (status 100)
        do {
            spiderStatus = await zap.spider.status(scanId);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        } while (spiderStatus.status !== '100');

        console.log('Spider scan completed.');

        // Start an active scan after the spider scan completes
        const scanResponse = await zap.ascan.scan({ url: targetUrl });
        const activeScanId = scanResponse.scan;

        let scanStatus;
        // Wait for the active scan to complete (status 100)
        do {
            scanStatus = await zap.ascan.status(activeScanId);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        } while (scanStatus.status !== '100');

        console.log('Active scan completed.');

        // Retrieve the security alerts from ZAP
        const alertsResponse = await zap.core.alerts({ baseurl: targetUrl });
        const alerts = alertsResponse.alerts;
        const processedAlertRefs = new Set();
        const metrics = [];

        // Process the alerts and filter unique ones
        for (const alert of alerts) {
            const alertRef = alert.alertRef;

            // Skip if alert has already been processed
            if (processedAlertRefs.has(alertRef)) {
                continue; 
            }
            processedAlertRefs.add(alertRef);

            // Prepare metrics from alert data
            if (alert) {
                const tags = alert.tags || {};
                const tag = {
                    OWASP_2021_A05: tags.OWASP_2021_A05 || null,
                    OWASP_2017_A06: tags.OWASP_2017_A06 || null
                };

                const securityMetrics = {
                    name: alert.name || alert.alert,
                    risk: alert.risk,
                    description: alert.description,
                    confidence: alert.confidence,
                    evidence: alert.evidence,
                    solution: alert.solution,
                    reference: alert.reference,
                    attacks: alert.attacks,
                    cweid: alert.cweid,
                    wascid: alert.wascid,
                    alertRef: alertRef,
                    tags: tag
                };
                
                metrics.push(securityMetrics);
            }
        }

        // Save the metrics if there are any
        if (metrics.length > 0) {
            const lastSavedMetrics = await Security.findOne({ url: targetUrl }).sort({ _id: -1 }).exec();

            // Compare the new metrics with the last saved metrics
            const areMetricsIdentical = lastSavedMetrics && JSON.stringify(lastSavedMetrics.metrics) === JSON.stringify(metrics);

            if (!areMetricsIdentical) {
                await Save(Security, { url: targetUrl }, metrics);
                console.log('Saved to DB');
            } else {
                console.log('Metrics are identical. Skipping save.');
            }
        } else {
            console.log('No metrics to save.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}
