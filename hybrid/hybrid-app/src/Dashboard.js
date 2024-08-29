import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import axios from 'axios';
import { Card } from '@tremor/react';
import { AgCharts } from "ag-charts-react";
import "ag-charts-enterprise";

function Dashboard() {
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const [intervalDuration, setIntervalDuration] = useState(30000);
    const [performance, setPerformanceData] = useState([]);
    const [performanceValue, setPerformanceValue] = useState([]);
    const [score, setScore] = useState(0);
    const [colorpal, setFills] = useState([]);
    const [ping, setPing] = useState([]);
    const [traceLatency, setTraceLatency] = useState([]);
    const [riskData, setRiskCount] = useState([]);

    const getValue = (percent, max) => {
        return (percent / 100 * max);
    };

    const getProgressColor = (value) => {
        if (value > 90) {
            return "green";
        } else if (value > 85) {
            return "yellow";
        } else if (value > 70) {
            return "orange";
        }
        else {
            return "red";
        }
    };

    const fetchPerformance = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/report/${encodeURIComponent(url)}`);
            const result = response.data;
            if (result && result.performanceMetrics) {
                const mobile = result.performanceMetrics.mobile;
                const desktop = result.performanceMetrics.desktop;
    
                // Calculate averages
                const averageCLS = (mobile.cls.value + desktop.cls.value) / 2;
                const averageTBT = (mobile.tbt.value + desktop.tbt.value) / 2;
                const averageSI = (mobile.si.value + desktop.si.value) / 2;
                const averageLCP = (mobile.lcp.value + desktop.lcp.value) / 2;
                const averageFCP = (mobile.fcp.value + desktop.fcp.value) / 2;
    
                // Calculate scaled scores
                const clsScore = Math.round(getValue(averageCLS, 25));
                const tbtScore = Math.round(getValue(averageTBT, 30));
                const siScore = Math.round(getValue(averageSI, 10));
                const lcpScore = Math.round(getValue(averageLCP, 25));
                const fcpScore = Math.round(getValue(averageFCP, 10));

                setFills([getProgressColor(averageCLS), getProgressColor(averageTBT), getProgressColor(averageSI), getProgressColor(averageLCP), getProgressColor(averageFCP)])
    
                // Update performance state
                setPerformanceData([
                    { metric: "CLS", score: clsScore, legend: `${clsScore}% CLS`},
                    { metric: "TBT", score: tbtScore, legend: `${tbtScore}% TBT`},
                    { metric: "SI", score: siScore, legend: `${siScore}% SI`},
                    { metric: "LCP", score: lcpScore, legend: `${lcpScore}% LCP`},
                    { metric: "FCP", score: fcpScore, legend: `${fcpScore}% FCP`},
                ]);

                const avgScore = (result.performanceMetrics.mobile.totalPerformance + result.performanceMetrics.desktop.totalPerformance) / 2;
                setScore(Math.round(avgScore));

                // Calculate averages
                const averageCLSValue = (mobile.cls.time + desktop.cls.time) / 2;
                const averageTBTValue = (mobile.tbt.time + desktop.tbt.time) / 2;
                const averageSIValue = (mobile.si.time + desktop.si.time) / 2;
                const averageLCPValue = (mobile.lcp.time + desktop.lcp.time) / 2;
                const averageFCPValue = (mobile.fcp.time + desktop.fcp.time) / 2;

                setPerformanceValue([     
                    { metric: "TBT", score: Math.round(averageTBTValue)},
                    { metric: "SI", score: Math.round(averageSIValue)},
                    { metric: "LCP", score: Math.round(averageLCPValue)},
                    { metric: "FCP", score: Math.round(averageFCPValue)},
                    { metric: "CLS", score: Math.round(averageCLSValue)},
                ]);
            }
        } catch (error) {
            console.error('Error fetching the report:', error);
        }
    };

    const fetchPing = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/ping/${encodeURIComponent(url)}`);
            const result = response.data;
            if (result && result.pingMetrics) {
                const currentTime = new Date();
                const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setPing((prevState) => [...prevState.slice(-19), { time: formattedTime, latency: result.pingMetrics.time }]);
            }
        } catch (error) {
            console.error('Error fetching the report:', error);
        }
    };

    const fetchTrace = async (url) => {
        try {
            const response = await axios.get(`http://localhost:8080/trace/${encodeURIComponent(url)}`);
            const result = response.data;
            if (result && result.tracerouteData) {
                const currentTime = new Date();
                const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Map over the traceroute data and add new entries
                const newEntries = result.tracerouteData.map(hop => ({
                    hop: `hop ${hop.hopNumber}`,
                    time: formattedTime,
                    latency: hop.latency
                }));
    
                // Combine with previous state and sort
                setTraceLatency(prevState => {
                    const updatedEntries = [...prevState, ...newEntries];
    
                    // Sort by hop number
                    updatedEntries.sort((a, b) => {
                        const hopA = parseInt(a.hop.split(' ')[1]);
                        const hopB = parseInt(b.hop.split(' ')[1]);
                        return hopA - hopB;
                    });
    
                    // Slice to keep only the last 20 entries
                    return updatedEntries.slice(-20);
                });
            }
        } catch (error) {
            console.error('Error fetching the report:', error);
        }
    };

    const fetchSecurity = async (url) => {
        try {
          const response = await axios.get(`http://localhost:8080/security/${encodeURIComponent(url)}`);
          const result = response.data;
          if (result && result.alerts) {
                const currentTime = new Date();
                const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const riskCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };
                const alertsByRisk = { High: [], Medium: [], Low: [], Informational: [] };
                const newAlerts = new Set();
                result.alerts.forEach(alert => {
                    newAlerts.add(alert.alertRef);
                    const alertList = alertsByRisk[alert.risk];
                    if (alertList && !alertList.some(existingAlert => existingAlert.id === alert.alertRef)) {
                        alertList.push(alert);
                        riskCounts[alert.risk] += 1;
                    }
                });
                
                setRiskCount((prevState) => [...prevState.slice(-19), { time: formattedTime, critical: riskCounts.High, medium: riskCounts.Medium, low: riskCounts.Low, informational: riskCounts.Informational }]);
            }
        } catch (error) {
            console.error('Error fetching the report:', error);
        }
    };
    

    useEffect(() => {
        const startPolling = async () => {
            await fetchPerformance(urls[0]);
            await fetchPing(urls[0]);
            await fetchTrace(urls[0]);
            await fetchSecurity(urls[0]);
            intervalRef.current = setTimeout(startPolling, intervalDuration);
        };

        startPolling();

        return () => {
            clearTimeout(intervalRef.current);
        };
    }, [intervalDuration, urls]);

    const sendReports = async (urls) => {
        try {
            const response = await axios.post('http://localhost:8080/report', urls.map(url => ({ url })));
            const data = response.data;

            console.log('Sent URLs and received data:', data);

            const newResults = data.map(([originalUrl]) => ({
                originalUrl,
                element: `Processing: ${originalUrl}`,
            }));

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

    const PerformanceChart = () => {
        const [options, setOptions] = useState({
            data: performance,
            title: {
                text: "Performance Score",
            },
            subtitle: {
                text: "Average scores",
            },
            series: [
                {
                    type: "donut",
                    calloutLabelKey: "metric",
                    legendItemKey: "legend",
                    angleKey: "score",
                    innerRadiusRatio: 0.7,
                    fills: colorpal,
                    innerLabels: [
                        {
                            text: `${score}%`,  
                            fontSize: 20,
                            color: getProgressColor(score),
                        },
                    ],
                    
                },
            ],
        });
    
        return <AgCharts options={options} />;
    };

    const Waterfall = () => {
        const [options, setOptions] = useState({
            data: performanceValue,
            title: {
                text: "Performance Metrics Waterfall",
            },
            subtitle: {
                text: "Average scores",
            },
            series: [
                {
                    type: "waterfall",
                    xKey: "metric",
                    xName: "Metrics",
                    yKey: "score",
                    yName: "delay",
                    item: {
                        score: {
                          fill: "#4A90E2",
                          stroke: "#4A90E2",
                        },
                    }
                },
            ],

            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                },
                {
                    type: 'number',
                    position: 'left',
                    label: {
                        formatter: (params) => `${params.value} ms`, // Format Y-axis labels as 'value ms'
                    },
                    
                },
            ],
            legend: {
                enabled: false, 
            },
        });
      
        return <AgCharts options={options} />;
    };

    const LineChart = () => {
        const [options, setOptions] = useState({
          title: {
            text: "Ping Latency",
          },
          series: [
            {
                data: ping,
                xKey: "time",
                yKey: "latency",
                yName: "Latency",
                interpolation: { type: "smooth" },
            }, 
          ],
          axes: [
            {
              type: "time",
              position: "bottom",
            },
            {
              type: "number",
              position: "left",
              label: {
                formatter: (params) => `${params.value} ms`, // Format Y-axis labels as 'value ms'
            },
              tick: {
                count: 4,  // Display only 4 labels
            },
            },
          ],
        });
           
        return <AgCharts options={options} />;
    };

    const Heatmap = () => {
        const [options, setOptions] = useState({
            data: traceLatency,
            title: {
                text: "Hop Latency Overtime",
            },
            series: [
                {
                    type: "heatmap",
                    xKey: "time",
                    xName: "Time",
                    yKey: "hop",
                    yName: "Hop Number",
                    colorKey: "latency",
                    colorName: "Latency",
                    // Use a specific color range based on latency values
                    colorRange: ["#00FF00", "#FFFF00", "#FFA500", "#FF0000"], // Green, Yellow, Orange, Red
                    colorDomain: [0, 50, 100, 200], // Corresponding latency thresholds
                },
            ],
            gradientLegend: {
                thickness: 2,
                position: "bottom",
                scale: {
                    label: {
                        format: "#{.0f} ms",
                    },
                },
            },
        });
    
        return <AgCharts options={options} />;
    };
    
    const SecurityChart = () => {
        const [options, setOptions] = useState({
          title: {
            text: "Security Threats by Category",
          },
          data: riskData,
          series: [
            {
              type: "bar",
              xKey: "time",
              yKey: "critical",
              yName: "Critical",
              direction: "horizontal",
            },
            {
              type: "bar",
              xKey: "time",
              yKey: "medium",
              yName: "Medium",
              direction: "horizontal",
            },
            {
              type: "bar",
              xKey: "time",
              yKey: "low",
              yName: "Low",
              direction: "horizontal",
            },
            {
              type: "bar",
              xKey: "time",
              yKey: "informational",
              yName: "Informational",
              direction: "horizontal",
            },
          ],
        });
      
        return <AgCharts options={options} />;
    };
return (
    <main className="Dashboard">
        <Sidebar alerts={0} url={urls} />
        <div className="p-4 sm:ml-64 mt-0">
            <div className='flex grid-cols-3 gap-2 text-mono'>
                <div className='col-span-1'>
                    <Card>
                        <PerformanceChart />
                    </Card>
                    <Card>
                        <Waterfall />
                    </Card>          
                </div>
                <div className='col-span-1'>
                    <Card>
                        <LineChart/>
                    </Card>
                    <Card>
                        <Heatmap />
                    </Card>
                </div>
                <div className='col-span-1'>
                    <Card>
                        <SecurityChart />
                    </Card>
                    <Card>
                        <h3>AI suggestion</h3>
                    </Card>
                </div>
                
            </div>
        </div>
    </main>
);
    }

export default Dashboard;
