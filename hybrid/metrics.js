/**
 * Calculates a scaled metric value based on the given thresholds and equivalency values.
 * If the value is less than or equal to `min`, it returns `equivalentMin`.
 * If the value is greater than or equal to `max`, it returns `equivalentMax`.
 * Otherwise, it calculates an interpolated value between the thresholds.
 *
 * @param {number} value - The metric value to be scaled.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @param {number} equivalentMin - The minimum equivalent value to return.
 * @param {number} equivalentMax - The maximum equivalent value to return.
 * @returns {number} The calculated equivalent value.
 */
export function calculateMetricValue(value, min, max, equivalentMin, equivalentMax) {
    if (value <= min) return equivalentMin;
    if (value >= max) return equivalentMax;
    return 100 - ((value - min) / (max - min)) * (100 - equivalentMax);
}

/**
 * Calculates performance metrics (FCP, SI, LCP, TBT, CLS) based on mobile or desktop form factor.
 * The function scales the raw values of these metrics using the `calculateMetricValue` function
 * and computes a total performance score based on weighted averages of the individual metrics.
 *
 * @param {number} fcp - First Contentful Paint (FCP) time in milliseconds.
 * @param {number} si - Speed Index (SI) time in milliseconds.
 * @param {number} lcp - Largest Contentful Paint (LCP) time in milliseconds.
 * @param {number} tbt - Total Blocking Time (TBT) time in milliseconds.
 * @param {number} cls - Cumulative Layout Shift (CLS) score.
 * @param {string} formFactor - The form factor being evaluated (either 'mobile' or 'desktop').
 * @returns {Object} An object containing the calculated metric values and the total performance score.
 * @returns {Object} return.fcp - The calculated FCP value and time.
 * @returns {Object} return.si - The calculated SI value and time.
 * @returns {Object} return.lcp - The calculated LCP value and time.
 * @returns {Object} return.tbt - The calculated TBT value and time.
 * @returns {Object} return.cls - The calculated CLS value and time.
 * @returns {number} return.totalPerformance - The total weighted performance score.
 */
export function calculatePerformanceMetrics(fcp, si, lcp, tbt, cls, formFactor) {
    if (formFactor === 'mobile') {
        const fcpValue = calculateMetricValue(fcp, 1000, 6000, 100, 4);
        const siValue = calculateMetricValue(si, 1000, 12000, 100, 4);
        const lcpValue = calculateMetricValue(lcp, 1000, 8000, 100, 3);
        const tbtValue = calculateMetricValue(tbt, 0, 3000, 100, 3);
        const clsValue = calculateMetricValue(cls, 0.00, 0.82, 100, 5);

        const totalPerformance =
            (fcpValue * 0.1) +
            (siValue * 0.1) +
            (lcpValue * 0.25) +
            (tbtValue * 0.3) +
            (clsValue * 0.25);
        
        return {
            fcp: { value: fcpValue, time: fcp },
            si: { value: siValue, time: si },
            lcp: { value: lcpValue, time: lcp },
            tbt: { value: tbtValue, time: tbt },
            cls: { value: clsValue, time: cls },
            totalPerformance,

        };
    } else {
        // Web (Desktop) performance metric calculation
        const fcpValue = calculateMetricValue(fcp, 0, 4000, 100, 1);
        const siValue = calculateMetricValue(si, 0, 5000, 100, 4);
        const lcpValue = calculateMetricValue(lcp, 0, 6000, 100, 5);
        const tbtValue = calculateMetricValue(tbt, 0, 2000, 100, 0);
        const clsValue = calculateMetricValue(cls, 0.00, 0.82, 100, 5);

        const totalPerformance =
            (fcpValue * 0.1) +
            (siValue * 0.1) +
            (lcpValue * 0.25) +
            (tbtValue * 0.3) +
            (clsValue * 0.25);

        return {
            fcp: { value: fcpValue, time: fcp },
            si: { value: siValue, time: si },
            lcp: { value: lcpValue, time: lcp },
            tbt: { value: tbtValue, time: tbt },
            cls: { value: clsValue, time: cls },
            totalPerformance,
        };
    }
}

export function filterAndTransform(diagnostics) {
  return diagnostics.map(item => {
      return {
          title: item.title || '',
          description: item.description || '',
          info: item.info || '',
          link: item.link || '',
          metrics: item.metrics || '',
          level: item.level || '',
          savings: item.savings || '',
          headings: item.details?.headings || [],
          items: item.details?.items || []
      };
  }).sort((a, b) => a.level - b.level);
}

  
