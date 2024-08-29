import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Additional, IPMap, PingChart, PingTracker, SSL, Table } from './network/network-utils';
import { Card } from '@tremor/react';

function Network() {
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const [intervalDuration, setIntervalDuration] = useState(30000);
    const [pingMetrics, setPingMetrics] = useState(null);
    const [pingTracker, setPingTracker] = useState([]);
    const [pingLatency, setLatency] = useState([]);
    const [sslCertificate, setCertificate] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [traceData, setTrace] = useState([]);

    const fetchData = async (url, endpoint, setStateCallback) => {
        try {
            const response = await axios.get(`http://localhost:8080/${endpoint}/${encodeURIComponent(url)}`);
            setStateCallback(response.data);
        } catch (error) {
            console.error(`Error fetching the report from ${endpoint}:`, error);
        }
    };

    const fetchPing = async (url) => {
        await fetchData(url, 'ping', (result) => {
            if (result && result.pingMetrics) {
                setPingMetrics(result.pingMetrics);
                const color = result.pingMetrics.alive ? 'green' : 'gray';
                const alive = {
                    color: color,
                    tooltip: result.pingMetrics.alive ? 'alive' : 'dead',
                };
                setPingTracker((prevState) => [...prevState.slice(-19), alive]);
                const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setLatency((prevState) => [...prevState.slice(-19), { time: currentTime, latency: result.pingMetrics.time }]);
            }
        });
    };

    const fetchSsl = async (url) => {
        await fetchData(url, 'SSL', setCertificate);
    };

    const fetchCoords = async (url) => {
        await fetchData(url, 'coord', (result) => {
            if (Array.isArray(result)) {
                setCoordinates(result.filter(coord => coord[0] !== null && coord[1] !== null));
            }
        });
    };

    const fetchTrace = async (url) => {
        await fetchData(url, 'trace', (result) => {
            if (result && result.tracerouteData) {
                setTrace(result.tracerouteData.map(hop => ({
                    hop: hop.hopNumber,
                    host: hop.ipAddress,
                    time: `${hop.latency}ms`
                })));
            }
        });
    };

    useEffect(() => {
        const startPolling = async () => {
            await Promise.all([
                fetchPing(urls[0]),
                fetchSsl(urls[0]),
                fetchCoords(urls[0]),
                fetchTrace(urls[0])
            ]);

            intervalRef.current = setTimeout(startPolling, intervalDuration);
        };

        startPolling();

        return () => {
            clearTimeout(intervalRef.current);
        };
    }, [intervalDuration, urls]);

    if (!pingMetrics) {
        return <div>Loading...</div>;
    }

    const aliveCount = pingTracker.filter(item => item.tooltip === 'alive').length;
    const totalCount = pingTracker.length;
    const percent = totalCount > 0 ? (aliveCount / totalCount) * 100 : 0;

    const getProgressColor = (value) => {
        if (value < 10) return "green";
        if (value < 50) return "yellow";
        if (value < 70) return "orange";
        return "red";
    };

    const color = getProgressColor(pingMetrics.packetLoss);

    return (
        <main className="Dashboard">
            <Sidebar alerts={0} url={urls} />
            <div className="p-4 sm:ml-64 mt-0">
                <div className="grid grid-cols-3 gap-2 w-full">
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className='text-center font-bold mb-2'>Ping Tracker</h3>
                            <PingTracker data={pingTracker} percent={percent} url={urls[0]} />
                            <h3 className='flex items-center text-base font-medium mt-4'>Packet Loss</h3>
                            <p className='flex mb-2 text-2xl font-semibold' style={{ color }}>{pingMetrics.packetLoss}%</p>
                        </Card>
                        <Card>
                            <h3 className='text-center font-bold mb-2'>Latency</h3>
                            <PingChart data={pingLatency} />
                        </Card>
                    </div>
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className='text-center font-bold mb-2'>SSL Certificate</h3>
                            <SSL data={sslCertificate} />
                        </Card>
                        <Card>
                            <Additional
                                title={'Get a free SSL certificate'}
                                param={"A Certificate Authority (CA) is a trusted third party that..."}
                                link={'https://letsencrypt.org/docs/'}
                                add={'online documentation.'}
                            />
                        </Card>
                    </div>
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className='text-center font-bold mb-2'>Trace Map</h3>
                            <IPMap coordinates={coordinates} />
                        </Card>
                        <Table data={traceData} />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Network;