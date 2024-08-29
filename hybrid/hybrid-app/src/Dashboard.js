import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { Badge, ProgressCircle } from '@tremor/react';
import { LineChart, AreaChart, Area, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
    const [results, setResults] = useState([]);
    const [totalPerformance, setTp] = useState([]);
    const [clsData, setCls] = useState([]);
    const [lcpData, setLcp] = useState([]);
    const [fcpData, setFcp] = useState([]);
    const [avgTotalPerformance, setAvgTp] = useState([]);
    const [avgClsData, setAvgCls] = useState([]);
    const [avgLcpData, setAvgLcp] = useState([]);
    const [avgFcpData, setAvgFcp] = useState([]);
    const [avgTotalPerformanceHour, setAvgTpHour] = useState([]);
    const [avgClsDataHour, setAvgClsHour] = useState([]);
    const [avgLcpDataHour, setAvgLcpHour] = useState([]);
    const [avgFcpDataHour, setAvgFcpHour] = useState([]);
    const [ping, setPingResults] = useState([]);
    const [pingAlive, setPingAlive] = useState();
    const [pingTime, setPingTime] = useState();
    const [pingLoss, setPingLoss] = useState();
    const [pingChartData, setPingChartData] = useState([]);
    const [trace, setTraceResults] = useState([]);
    const [latency, setLatencyResult] = useState([]);
    const [traceChartData, setTraceChartData] = useState([]);
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const saveTimerRef = useRef(null);

    // Function to fetch results from the server
    const fetchResults = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/report/${encodeURIComponent(url)}`);
            const result = response.data;
            console.log('Fetched result:', result);

            if (result && result.performanceMetrics) {
                // Update results state
                setResults(prevResults =>
                    prevResults.map(r =>
                        r.originalUrl === url
                        ? { ...r, element: result.performanceMetrics }
                        : r
                    )
                );
                saveResults(result);
                return result; // Return the result to use in the timer function
            }
            return null;
        } catch (error) {
            console.error('Error fetching the report:', error);
            return null;
        }
    };

    const fetchPing = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/ping/${encodeURIComponent(url)}`);
            const result = response.data;
            console.log('Fetched result:', result);

            if (result && result.pingMetrics) {
                // Update results state
                setPingResults(prevPing =>
                    prevPing.map(r =>
                        r.originalUrl === url
                        ? { ...r, element: result.pingMetrics }
                        : r
                    )
                );
                savePing(result);
                return result; // Return the result to use in the timer function
            }
            return null;
        } catch (error) {
            console.error('Error fetching the report:', error);
            return null;
        }
    };

    const fetchTrace = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/trace/${encodeURIComponent(url)}`);
            const result = response.data;
            console.log('Fetched result:', result);

            if (result && result.tracerouteData) {
                // Update results state
                setTraceResults(prevTrace =>
                    prevTrace.map(r =>
                        r.originalUrl === url
                        ? { ...r, element: result.tracerouteData}
                        : r
                    )
                );
                saveTrace(result);
                return result; 
            }
            return null;
        } catch (error) {
            console.error('Error fetching the report:', error);
            return null;
        }
    };

    // Save results both devices
    const saveResults = (result) => {
        if (!result || !result.performanceMetrics) return;

        // time of results
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // average performance score
        const lastMobileValue = totalPerformance[totalPerformance.length - 1]?.mobile || result.performanceMetrics.mobile.totalPerformance;
        const avgMobile = (lastMobileValue + result.performanceMetrics.mobile.totalPerformance) / 2;
        const lastDesktopValue = totalPerformance[totalPerformance.length - 1]?.desktop || result.performanceMetrics.desktop.totalPerformance;
        const avgDesktop = (lastDesktopValue + result.performanceMetrics.desktop.totalPerformance) / 2;

        // total performance
        const newTotalPerformance = {
            time: formattedTime,
            mobile: result.performanceMetrics.mobile.totalPerformance,
            desktop: result.performanceMetrics.desktop.totalPerformance,
            avgMobile: avgMobile,
            avgDesktop: avgDesktop
        };

        setTp(prevData => {
            const updatedTotalPerformance = [...prevData, newTotalPerformance].slice(-20);
            return updatedTotalPerformance;
        });

        // average cls
        const lastClsMobileValue = clsData[clsData.length - 1]?.mobileCls || result.performanceMetrics.mobile.cls.value;
        const avgClsMobile = (lastClsMobileValue + result.performanceMetrics.mobile.cls.value) / 2;
        const lastDesktopClsValue = clsData[clsData.length - 1]?.desktopCls || result.performanceMetrics.desktop.cls.value;
        const avgDesktopCls = (lastDesktopClsValue + result.performanceMetrics.desktop.cls.value) / 2;

        // cls
        const newCls = {
            time: formattedTime,
            mobileCls: result.performanceMetrics.mobile.cls.value,
            mobileClsValue: result.performanceMetrics.mobile.cls.time,
            desktopCls: result.performanceMetrics.desktop.cls.value,
            desktopClsValue: result.performanceMetrics.desktop.cls.time,
            avgMobileCls: avgClsMobile,
            avgDesktopCls: avgDesktopCls,
        };

        setCls(prevData => {
            const updatedCls = [...prevData, newCls].slice(-20);
            return updatedCls;
        });

        // average lcp
        const lastLcpMobileValue = lcpData[lcpData.length - 1]?.mobileLcp || result.performanceMetrics.mobile.lcp.value;
        const avgLcpMobile = (lastLcpMobileValue + result.performanceMetrics.mobile.lcp.value) / 2;
        const lastDesktopLcpValue = lcpData[lcpData.length - 1]?.desktopLcp || result.performanceMetrics.desktop.lcp.value;
        const avgDesktopLcp = (lastDesktopLcpValue + result.performanceMetrics.desktop.lcp.value) / 2;

        // lcp
        const newLcp = {
            time: formattedTime,
            mobileLcp: result.performanceMetrics.mobile.lcp.value,
            mobileLcpValue: result.performanceMetrics.mobile.lcp.time,
            desktopLcp: result.performanceMetrics.desktop.lcp.value,
            desktopLcpValue: result.performanceMetrics.desktop.lcp.time,
            avgMobileLcp: avgLcpMobile,
            avgDesktopLcp: avgDesktopLcp,
        };

        setLcp(prevData => {
            const updatedLcp = [...prevData, newLcp].slice(-20);
            return updatedLcp;
        });

        // average fcp
        const lastFcpMobileValue = fcpData[fcpData.length - 1]?.mobileFcp || result.performanceMetrics.mobile.fcp.value;
        const avgFcpMobile = (lastFcpMobileValue + result.performanceMetrics.mobile.fcp.value) / 2;
        const lastDesktopFcpValue = fcpData[fcpData.length - 1]?.desktopFcp || result.performanceMetrics.desktop.fcp.value;
        const avgDesktopFcp = (lastDesktopFcpValue + result.performanceMetrics.desktop.fcp.value) / 2;

        // fcp
        const newFcp = {
            time: formattedTime,
            mobileFcp: result.performanceMetrics.mobile.fcp.value,
            mobileFcpValue: result.performanceMetrics.mobile.fcp.time,
            desktopFcp: result.performanceMetrics.desktop.fcp.value,
            desktopFcpValue: result.performanceMetrics.desktop.fcp.time,
            avgMobileFcp: avgFcpMobile,
            avgDesktopFcp: avgDesktopFcp,
        };

        setFcp(prevData => {
            const updatedFcp = [...prevData, newFcp].slice(-20);
            return updatedFcp;
        });
    };

    const savePing = (result) => {
        if (!result || !result.pingMetrics) return;

        setPingAlive(result.pingMetrics.alive);
        setPingTime(result.pingMetrics.time);
        setPingLoss(result.pingMetrics.packetLoss);

        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const pingChart = {
            time: formattedTime,
            ping: result.pingMetrics.time,
        };

        setPingChartData(prevData => {
            const updatedPing = [...prevData, pingChart].slice(-20);
            return updatedPing;
        });
    }

    const saveTrace = (result) => {
        if (!result || !result.tracerouteData) return;

        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        
        const latencies = result.tracerouteData.map(entry => parseFloat(entry.latency));
        const highestLatency = Math.max(...latencies);
        const lowestLatency = Math.min(...latencies);
        if (isFinite(highestLatency)) {
            const traceChart = {
                time: formattedTime,
                high: highestLatency,
                low: lowestLatency,
            };
    
            setLatencyResult(highestLatency);
    
            setTraceChartData(prevData => {
                const updatedPing = [...prevData, traceChart].slice(-20);
                return updatedPing;
            });
        }
    }

    // Save results both devices for the last 24 hours
    const saveTwentyFourHourResults = (result) => {
        if (!result || !result.performanceMetrics) return;

        // time of results
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // average performance score
        const lastMobileValue = totalPerformance[totalPerformance.length - 1]?.avgMobile || result.performanceMetrics.mobile.totalPerformance;
        const lastDesktopValue = totalPerformance[totalPerformance.length - 1]?.avgDesktop || result.performanceMetrics.desktop.totalPerformance;

        // total performance
        const newAvgPerformance = {
            time: formattedTime,
            mobile: lastMobileValue,
            desktop: lastDesktopValue,
        };

        setAvgTp(prevData => {
            const updatedTotalPerformance = [...prevData, newAvgPerformance].slice(-20);
            return updatedTotalPerformance;
        });

        // average cls
        const lastClsMobileValue = clsData[clsData.length - 1]?.avgMobileCls || result.performanceMetrics.mobile.cls.value;
        const lastDesktopClsValue = clsData[clsData.length - 1]?.avgDesktopCls || result.performanceMetrics.desktop.cls.value;

        // cls
        const newCls = {
            time: formattedTime,
            avgMobileCls: lastClsMobileValue,
            avgDesktopCls: lastDesktopClsValue,
        };

        setAvgCls(prevData => {
            const updatedCls = [...prevData, newCls].slice(-20);
            return updatedCls;
        });

        // average lcp
        const lastLcpMobileValue = lcpData[lcpData.length - 1]?.avgMobileLcp || result.performanceMetrics.mobile.lcp.value;
        const lastDesktopLcpValue = lcpData[lcpData.length - 1]?.avgDesktopLcp || result.performanceMetrics.desktop.lcp.value;

        // lcp
        const newLcp = {
            time: formattedTime,
            avgMobileLcp: lastLcpMobileValue,
            avgDesktopLcp: lastDesktopLcpValue,
        };

        setAvgLcp(prevData => {
            const updatedLcp = [...prevData, newLcp].slice(-20);
            return updatedLcp;
        });

        // average fcp
        const lastFcpMobileValue = fcpData[fcpData.length - 1]?.avgMobileFcp || result.performanceMetrics.mobile.fcp.value;
        const lastFcpDesktopValue = fcpData[fcpData.length - 1]?.avgDesktopFcp || result.performanceMetrics.desktop.fcp.value;

        // fcp
        const newFcp = {
            time: formattedTime,
            avgMobileFcp: lastFcpMobileValue,
            avgDesktopFcp: lastFcpDesktopValue,
        };

        setAvgFcp(prevData => {
            const updatedFcp = [...prevData, newFcp].slice(-20);
            return updatedFcp;
        });
    };

    const saveHourlyResults = (result) => {
        if (!result || !result.performanceMetrics) return;

        // time of results
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // average performance score
        const lastMobileValue = totalPerformance[totalPerformance.length - 1]?.avgMobile || result.performanceMetrics.mobile.totalPerformance;
        const lastDesktopValue = totalPerformance[totalPerformance.length - 1]?.avgDesktop || result.performanceMetrics.desktop.totalPerformance;

        // total performance
        const newAvgPerformance = {
            time: formattedTime,
            mobile: result.performanceMetrics.mobile.totalPerformance,
            desktop: result.performanceMetrics.desktop.totalPerformance,
        };

        setAvgTpHour(prevData => {
            const updatedTotalPerformance = [...prevData, newAvgPerformance].slice(-20);
            return updatedTotalPerformance;
        });

        // average cls
        const lastClsMobileValue = clsData[clsData.length - 1]?.avgMobileCls || result.performanceMetrics.mobile.cls.value;
        const lastDesktopClsValue = clsData[clsData.length - 1]?.avgDesktopCls || result.performanceMetrics.desktop.cls.value;

        // cls
        const newCls = {
            time: formattedTime,
            avgMobileCls: lastClsMobileValue,
            avgDesktopCls: lastDesktopClsValue,
        };

        setAvgClsHour(prevData => {
            const updatedCls = [...prevData, newCls].slice(-20);
            return updatedCls;
        });

        // average lcp
        const lastLcpMobileValue = lcpData[lcpData.length - 1]?.avgMobileLcp || result.performanceMetrics.mobile.lcp.value;
        const lastDesktopLcpValue = lcpData[lcpData.length - 1]?.avgDesktopLcp || result.performanceMetrics.desktop.lcp.value;

        // lcp
        const newLcp = {
            time: formattedTime,
            avgMobileLcp: lastLcpMobileValue,
            avgDesktopLcp: lastDesktopLcpValue,
        };

        setAvgLcpHour(prevData => {
            const updatedLcp = [...prevData, newLcp].slice(-20);
            return updatedLcp;
        });

        // average fcp
        const lastFcpMobileValue = fcpData[fcpData.length - 1]?.avgMobileFcp || result.performanceMetrics.mobile.fcp.value;
        const lastFcpDesktopValue = fcpData[fcpData.length - 1]?.avgDesktopFcp || result.performanceMetrics.desktop.fcp.value;

        // fcp
        const newFcp = {
            time: formattedTime,
            avgMobileFcp: lastFcpMobileValue,
            avgDesktopFcp: lastFcpDesktopValue,
        };

        setAvgFcpHour(prevData => {
            const updatedFcp = [...prevData, newFcp].slice(-20);
            return updatedFcp;
        });
    };

    // Polling function to periodically fetch data
    const pollResults = (url) => {
        // Variable to keep track of the timeout ID
        const intervalHandle = setInterval(async () => {
            const result = await fetchResults(url);
            const pingResults = await fetchPing(url);
            const traceResults = await fetchTrace(url);

            if (result && pingResults && traceResults) {
                // Save results as soon as obtained
                saveResults(result);
                savePing(pingResults);
                saveTrace(traceResults);
            }
        }, 30000); // Polling every 30 seconds

        return intervalHandle;
    };

    useEffect(() => {
        intervalRef.current = 1;
    
        // Function to initialize polling
        const startPolling = () => {
            const handles = urls.map(url => pollResults(url));
    
            // Fetch initial results for each URL
            urls.forEach(url => {
                fetchResults(url).then(result => {
                    if (result) {
                        saveTwentyFourHourResults(result);
                        saveHourlyResults(result);
                    }
                });
            });
    
            // Set up the 72-minute timer for saving results
            const seventyTwoMinuteInterval = setInterval(() => {
                urls.forEach(url => {
                    fetchResults(url).then(result => {
                        if (result) {
                            saveTwentyFourHourResults(result);
                        }
                    });
                });
            }, 72 * 60 * 1000); // 72 minutes in milliseconds
    
            // Set up the 3-minute timer for saving results
            const threeMinuteInterval = setInterval(() => {
                urls.forEach(url => {
                    fetchResults(url).then(result => {
                        if (result) {
                            saveHourlyResults(result);
                        }
                    });
                });
            }, 3 * 60 * 1000); // 3 minutes in milliseconds
    
            // Cleanup function to clear intervals
            return () => {
                handles.forEach(handle => clearInterval(handle));
                clearInterval(seventyTwoMinuteInterval);
                clearInterval(threeMinuteInterval);
            };
        };
    
        if (urls.length > 0) {
            const cleanup = startPolling();
            return cleanup;
        }
    }, [urls]);
    

    const sendReports = async (urls) => {
        try {
            const response = await axios.post('http://localhost:8080/report', urls.map(url => ({ url })));
            const data = response.data;

            console.log('Sent URLs and received data:', data);

            const newResults = data.map(([originalUrl]) => ({
                originalUrl,
                element: `Processing: ${originalUrl}`,
            }));

            setResults(newResults);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            alert('Something went wrong while sending our request: ' + error.message);
        }
    };

    useEffect(() => {
        if (urls.length > 0) {
            sendReports(urls);
        }
    }, [urls]);

    const getCaretAndColor = (incre) => {
        if (incre > 0) {
            return { caret: FaCaretUp, color: 'green' }; // Return the component, not the JSX
        } else if (incre < 0) {
            return { caret: FaCaretDown, color: 'red' };
        } else {
            return { caret: null, color: 'default' };
        }
    };

    const getValueDiff = (valOne, valTwo) => {
        const diff = valOne - valTwo;
        const percentageVal = (diff / valTwo) * 100;

        return { diff, percentageVal };
    }

    const getProgressColor = (value) => {
        if (value > 90) {
            return "green";
        } else if (value > 50) {
            return "orange";
        } else {
            return "red";
        }
    };

    const PerformanceProgress = ({score, title}) => (
        <div className="mx-auto items-center border-r-2">
            <h6 className='text-mono text-center font-medium text-sm'>{title}</h6>
            <ProgressCircle
                value={score}
                size="md"
                color={getProgressColor(score)}
                strokeWidth={10}
                radius={40}
                className='mt-2 ml-5 mr-5 mb-2'
            >
            <span className="text-xs font-medium text-slate-700">{score}%</span>
            </ProgressCircle>
        </div>
    );
    
    // performance score
    const totalPerf = (totalPerformance[totalPerformance.length - 1]?.mobile + totalPerformance[totalPerformance.length - 1]?.desktop)/2;
    const { diff: mobileDiff, percentageVal: mobileVal } = getValueDiff(
        totalPerformance[totalPerformance.length - 1]?.mobile,
        totalPerformance[totalPerformance.length - 1]?.avgMobile
    );
    
    const { diff: desktopDiff, percentageVal: desktopVal } = getValueDiff(
        totalPerformance[totalPerformance.length - 1]?.desktop,
        totalPerformance[totalPerformance.length - 1]?.avgDesktop
    );    
    
    // Get the caret and color
    const { caret: mobileCaret, color: mobileColor } = getCaretAndColor(Number(mobileDiff));
    const { caret: desktopCaret, color: desktopColor } = getCaretAndColor(Number(desktopDiff));

    // CLS
    const avgCLS = (clsData[clsData.length -1]?.mobileCls + clsData[clsData.length - 1]?.desktopCls)/2;
    const { diff: mobileClsDiff, percentageVal: mobileClsVal } = getValueDiff(
        clsData[clsData.length - 1]?.mobileCls,
        clsData[clsData.length - 1]?.avgMobileCls
    );    
    const { diff: desktopClsDiff, percentageVal: desktopClsVal } = getValueDiff(
        clsData[clsData.length - 1]?.desktopCls,
        clsData[clsData.length - 1]?.avgDesktopCls
    );
    
    const { caret: mobileClsCaret, color: mobileClsColor } = getCaretAndColor(mobileClsDiff);
    const { caret: desktopClsCaret, color: desktopClsColor } = getCaretAndColor(desktopClsDiff);

    // Lcp
    const avgLCP = (lcpData[lcpData.length -1]?.mobileLcp + lcpData[lcpData.length - 1]?.desktopLcp)/2;
    const { diff: mobileLcpDiff, percentageVal: mobileLcpVal } = getValueDiff(
        lcpData[lcpData.length - 1]?.mobileLcp,
        lcpData[lcpData.length - 1]?.avgMobileLcp
    );    
    const { diff: desktopLcpDiff, percentageVal: desktopLcpVal } = getValueDiff(
        lcpData[lcpData.length - 1]?.desktopLcp,
        lcpData[lcpData.length - 1]?.avgDesktopLcp
    );
    
    const { caret: mobileLcpCaret, color: mobileLcpColor } = getCaretAndColor(mobileLcpDiff);
    const { caret: desktopLcpCaret, color: desktopLcpColor } = getCaretAndColor(desktopLcpDiff);

    // lcp in seconds
    const mobileLcp = lcpData[lcpData.length - 1]?.mobileLcpValue / 1000;
    const desktopLcp = lcpData[lcpData.length - 1]?.desktopLcpValue / 1000;

    // Fcp
    const avgFCP = (fcpData[fcpData.length -1]?.mobileFcp + fcpData[fcpData.length - 1]?.desktopFcp)/2;
    const { diff: mobileFcpDiff, percentageVal: mobileFcpVal } = getValueDiff(
        fcpData[fcpData.length - 1]?.mobileFcp,
        lcpData[lcpData.length - 1]?.avgMobileFcp
    );    
    const { diff: desktopFcpDiff, percentageVal: desktopFcpVal } = getValueDiff(
        fcpData[fcpData.length - 1]?.desktopFcp,
        fcpData[fcpData.length - 1]?.avgDesktopFcp
    );
    
    const { caret: mobileFcpCaret, color: mobileFcpColor } = getCaretAndColor(mobileFcpDiff);
    const { caret: desktopFcpCaret, color: desktopFcpColor } = getCaretAndColor(desktopFcpDiff);

    // lcp in seconds
    const mobileFcp = fcpData[fcpData.length - 1]?.mobileFcpValue / 1000;
    const desktopFcp = fcpData[fcpData.length - 1]?.desktopFcpValue / 1000;

return (
    <main className="Dashboard">
        <Sidebar alerts={0} url={urls} />
        <div className="p-4 sm:ml-64 mt-0">
            <h3>Performance Metrics</h3>
            <div className="flex grid-cols-4 gap-2 mb-4 light:bg-pink-50 mt-0">   
                <div className='mx-auto dark:bg-pink-50 mt-0'>
                    <h6 className='text-center text-mono font-semibold'>Performance Score</h6> 
                    <div className='flex grid-cols-2 gap-2 light:bg-pink-50 mt-0'> 
                        <PerformanceProgress
                            score ={Math.round(totalPerf)}
                            title={'AVG Score'}
                        />
                        <div className='mr-2'>
                            <h6 className='text-mono text-left font-medium text-sm'>by device:</h6>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: mobileColor}}>Mobile:
                                    <span className='ml-1 text-lg'>{Number(totalPerformance[totalPerformance.length - 1]?.mobile.toFixed(2))}%</span>
                                    <span className='ml-3 text-sm'>
                                        <Badge 
                                            color={mobileColor}
                                            size='xs'
                                            icon={mobileCaret ? mobileCaret : undefined}
                                            style={{fontSize: '10px'}}
                                        >
                                            {mobileVal.toFixed(3)}
                                        </Badge>
                                    </span>
                                </p>
                            </div>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: desktopColor}}>Desktop:
                                    <span className='ml-1 text-lg'>{Number(totalPerformance[totalPerformance.length - 1]?.desktop.toFixed(2))}%</span>
                                    <span className='ml-2 text-sm'>
                                        <Badge 
                                            color={desktopColor}
                                            size='xs'
                                            icon={desktopCaret ? desktopCaret : undefined}
                                            style={{fontSize: '10px'}}
                                        >
                                            {desktopVal.toFixed(3)}
                                        </Badge>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mx-auto dark:bg-pink-50 mt-0'>
                    <h6 className='text-center text-mono font-semibold'>CLS</h6> 
                    <div className='flex grid-cols-2 gap-2 light:bg-pink-50 mt-0'> 
                        <PerformanceProgress
                            score ={Math.round(avgCLS)}
                            title = {"AVG CLS"}
                        />
                        <div className='mr-2'>
                            <h6 className='text-mono text-left font-medium text-sm'>by device:</h6>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: mobileClsColor}}>Mobile:
                                    <span className='ml-3 text-lg'>{Number(clsData[clsData.length - 1]?.mobileClsValue.toFixed(2))}</span>
                                </p>
                            </div>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500'style={{color: desktopClsColor}}>Desktop:
                                    <span className='ml-1 text-lg'>{Number(clsData[clsData.length - 1]?.desktopClsValue.toFixed(2))}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mx-auto dark:bg-pink-50 mt-0'>
                    <h6 className='text-center text-mono font-semibold'>LCP</h6> 
                    <div className='flex grid-cols-2 gap-2 light:bg-pink-50 mt-0'> 
                        <PerformanceProgress
                            score ={Math.round(avgLCP)}
                            title = {"AVG LCP"}
                        />
                        <div className='mr-2'>
                            <h6 className='text-mono text-left font-medium text-sm'>by device:</h6>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: mobileLcpColor}}>Mobile:
                                    <span className='ml-3 text-lg'>{Number(mobileLcp.toFixed(3))}s</span>
                                </p>
                            </div>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: desktopLcpColor}}>Desktop:
                                    <span className='ml-1 text-lg' >{Number(desktopLcp.toFixed(3))}s</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mx-auto dark:bg-pink-50 mt-0'>
                    <h6 className='text-center text-mono font-semibold'>FCP</h6> 
                    <div className='flex grid-cols-2 gap-2 light:bg-pink-50 mt-0'> 
                        <PerformanceProgress
                            score ={Math.round(avgFCP)}
                            title = {"AVG FCP"}
                        />
                        <div className='mr-2'>
                            <h6 className='text-mono text-left font-medium text-sm'>by device:</h6>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: mobileFcpColor}}>Mobile:
                                    <span className='ml-3 text-lg'>{Number(mobileFcp.toFixed(3))}s</span>
                                </p>
                            </div>
                            <div className='ml-2 font-serif text-sm'>
                                <p className='text-left text-gray-500' style={{color: desktopFcpColor}}>Desktop:
                                    <span className='ml-1 text-lg' >{Number(desktopFcp.toFixed(3))}s</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                  
            </div>
            <h3>Trends</h3>
            <div className='flex grid-cols-3 gap-2 mb-4 dark:bg-pink-50 mt-0'>
                <div className='flex-col gap-2 mb-4 dark:bg-pink-50 mt-0'>
                    <h3>Last 24hrs</h3>
                    <LineChart 
                        width={300} 
                        height={175} 
                        data={avgTotalPerformance}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        isAnimationActive={false}
                        className='text-mono text-xs'
                    >
                        <Legend verticalAlign="top" height={36} /> 
                        <XAxis dataKey="time" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Line type="monotone" dataKey="mobile" stroke="red" fillOpacity={0.4} fill="purple" dot={false} />
                        <Line type="monotone" dataKey="desktop" stroke="purple" fillOpacity={0.4} fill="red" dot={false}/>
                    </LineChart>
                    <h3>Last 1hour</h3>
                    <LineChart 
                        width={300} 
                        height={175} 
                        data={avgTotalPerformanceHour}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        isAnimationActive={false}
                        className='text-mono text-xs'
                    >
                        <Legend verticalAlign="top" height={36} /> 
                        <XAxis dataKey="time" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Line type="monotone" dataKey="mobile" stroke="red" fillOpacity={0.4} fill="purple" dot={false} />
                        <Line type="monotone" dataKey="desktop" stroke="purple" fillOpacity={0.4} fill="red" dot={false}/>
                    </LineChart>
                </div>
                <div>
                    <AreaChart 
                        width={300} 
                        height={175} 
                        data={pingChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        isAnimationActive={false}
                        className='text-mono text-xs'
                    >
                        <Legend verticalAlign="top" height={36} /> 
                        <XAxis dataKey="time" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Area type="monotone" dataKey="ping" stroke="red" fillOpacity={0.4} fill="purple" dot={false} />
                    </AreaChart>
                    <AreaChart 
                        width={300} 
                        height={175} 
                        data={traceChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        isAnimationActive={false}
                        className='text-mono text-xs'
                    >
                        <Legend verticalAlign="top" height={36} /> 
                        <XAxis dataKey="time" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Area type="monotone" dataKey="high" stroke="red" fillOpacity={0.4} fill="purple" dot={false} />
                        <Area type="monotone" dataKey="low" stroke="red" fillOpacity={0.4} fill="green" dot={false} />
                    </AreaChart>
                    
                </div>
            </div>
        </div>
    </main>
);
    }

export default Dashboard;
