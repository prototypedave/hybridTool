import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { calculatePerformanceMetrics, filterAndTransform } from './metrics.js';
import { saveDiagnostics } from "./schemas.js";

let sharedBrowser;
let sharedPage;

/**
 * Launches and returns a shared Puppeteer browser instance.
 * If a browser instance is already open and connected, it returns the existing instance.
 *
 * @returns {Promise<puppeteer.Browser>} The shared Puppeteer browser instance.
 */
export async function getSharedBrowser() {
    if (!sharedBrowser || !sharedBrowser.isConnected()) {
        sharedBrowser = await puppeteer.launch({
            args: ["--show-paint-rects"]
        });
    }
    return sharedBrowser;
}

/**
 * Opens and returns a shared Puppeteer page. 
 * If a page is already open and not closed, it returns the existing page.
 *
 * @param {puppeteer.Browser} browser - The Puppeteer browser instance.
 * @returns {Promise<puppeteer.Page>} The shared Puppeteer page.
 */
async function getSharedPage(browser) {
    if (!sharedPage || sharedPage.isClosed()) {
        sharedPage = await browser.newPage();
    }
    return sharedPage;
}

/**
 * Runs Lighthouse on the specified URL with retries on failure.
 * 
 * @param {string} url - The URL to audit with Lighthouse.
 * @param {Object} config - Lighthouse configuration options.
 * @param {number} [maxRetries=3] - The maximum number of retry attempts.
 * @returns {Promise<Object>} The result of the Lighthouse audit.
 * @throws {Error} If the Lighthouse audit fails after the specified number of retries.
 */
async function runLighthouseWithRetry(url, config, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await lighthouse(url, config);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i === maxRetries - 1) throw error;
        }
    }
}

/**
 * Creates a performance report for both mobile and desktop form factors using Lighthouse.
 * 
 * @param {puppeteer.Browser} browser - The Puppeteer browser instance.
 * @param {string} url - The URL to audit with Lighthouse.
 * @param {Object} [options={ output: "html" }] - The output options for Lighthouse reports.
 * @param {string} [options.output="html"] - The output format of the Lighthouse report (e.g., "html", "json").
 * @returns {Promise<Object>} The performance metrics for both mobile and desktop.
 * @throws {Error} If the Lighthouse audit fails.
 */
export async function createReportWithBrowser(browser, url, options = { output: "html" }) {
    const endpoint = browser.wsEndpoint();
    const endpointURL = new URL(endpoint);

    const page = await getSharedPage(browser);
    await page.goto('about:blank'); 

    let mobileResult, desktopResult;
    try {
        mobileResult = await runLighthouseWithRetry(
            url,
            {
                port: endpointURL.port,
                output: options.output,
                onlyCategories: ['performance'],
                emulatedFormFactor: 'mobile',
            }
        );

        const { lhr: lhrMobile } = mobileResult;
        const metricsMobile = {
            fcp: lhrMobile.audits['first-contentful-paint'].numericValue,
            lcp: lhrMobile.audits['largest-contentful-paint'].numericValue,
            tbt: lhrMobile.audits['total-blocking-time'].numericValue,
            cls: lhrMobile.audits['cumulative-layout-shift'].numericValue,
            si: lhrMobile.audits['speed-index'].numericValue,
        };

        const diagnosticsMobile = Object.keys(lhrMobile.audits)
            .filter(auditKey => lhrMobile.audits[auditKey].details && lhrMobile.audits[auditKey].details.type === 'opportunity')
            .map(auditKey => {
                const audit = lhrMobile.audits[auditKey];
                return {
                    title: audit.title,
                    description: audit.description,
                    displayValue: audit.displayValue,
                    metricSavings: audit.metricSavings,
                    level: audit.guidanceLevel,
                    details: audit.details.overallSavingsMs || audit.details.overallSavingsBytes ? {
                        potentialSavings: audit.details.overallSavingsMs ? `${audit.details.overallSavingsMs} ms` : undefined,
                        potentialSavingsBytes: audit.details.overallSavingsBytes ? `${audit.details.overallSavingsBytes / 1024} KiB` : undefined,
                        headings: audit.details.headings,
                        items: audit.details.items
                    } : null
                };
            });

        const filtMobile = filterAndTransform(diagnosticsMobile);
        const performanceScoreMobile = calculatePerformanceMetrics(
            metricsMobile.fcp,
            metricsMobile.si,
            metricsMobile.lcp,
            metricsMobile.tbt,
            metricsMobile.cls,
            'mobile',
            
        );
        
           
        desktopResult = await runLighthouseWithRetry(
            url,
            {
                port: endpointURL.port,
                output: options.output,
                onlyCategories: ['performance'],
                emulatedFormFactor: 'desktop',
            }
        );

        const { lhr: lhrDesktop } = desktopResult;
        const metricsDesktop = {
            fcp: lhrDesktop.audits['first-contentful-paint'].numericValue,
            lcp: lhrDesktop.audits['largest-contentful-paint'].numericValue,
            tbt: lhrDesktop.audits['total-blocking-time'].numericValue,
            cls: lhrDesktop.audits['cumulative-layout-shift'].numericValue,
            si: lhrDesktop.audits['speed-index'].numericValue,
        };

        const diagnosticsDesktop = Object.keys(lhrDesktop.audits)
            .filter(auditKey => lhrDesktop.audits[auditKey].details && lhrDesktop.audits[auditKey].details.type === 'opportunity')
            .map(auditKey => {
                const audit = lhrDesktop.audits[auditKey];
                return {
                    title: audit.title,
                    description: audit.description,
                    displayValue: audit.displayValue,
                    metricSavings: audit.metricSavings,
                    level: audit.guidanceLevel,
                    details: audit.details.overallSavingsMs || audit.details.overallSavingsBytes ? {
                        potentialSavings: audit.details.overallSavingsMs ? `${audit.details.overallSavingsMs} ms` : undefined,
                        potentialSavingsBytes: audit.details.overallSavingsBytes ? `${audit.details.overallSavingsBytes / 1024} KiB` : undefined,
                        headings: audit.details.headings,
                        items: audit.details.items
                    } : null
                };
            });

        const filtDesktop = filterAndTransform(diagnosticsDesktop);
        saveDiagnostics(filtMobile, filtDesktop, url);
        const performanceScoreDesktop = calculatePerformanceMetrics(
            metricsDesktop.fcp,
            metricsDesktop.si,
            metricsDesktop.lcp,
            metricsDesktop.tbt,
            metricsDesktop.cls,
            'desktop',
            
        );

        return {
            performanceMetrics: {
                mobile: performanceScoreMobile,
                desktop: performanceScoreDesktop,
            }
        };
    } catch (error) {
        throw new Error('Lighthouse run failed: ' + error.message);
    }
}

/**
 * Closes the shared Puppeteer browser when the process exits.
 * 
 * @event process:exit
 */
process.on('exit', async () => {
    if (sharedBrowser) {
        await sharedBrowser.close();
    }
});

/**
 * Closes the shared Puppeteer browser and exits the process when a SIGINT signal is received (Ctrl+C).
 * 
 * @event process:SIGINT
 */
process.on('SIGINT', async () => {
    if (sharedBrowser) {
        await sharedBrowser.close();
        process.exit();
    }
});

/**
 * Closes the shared Puppeteer browser and exits the process when an uncaught exception occurs.
 * 
 * @event process:uncaughtException
 * @param {Error} err - The uncaught exception error.
 */
process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    if (sharedBrowser) {
        await sharedBrowser.close();
    }
    process.exit(1);
});
