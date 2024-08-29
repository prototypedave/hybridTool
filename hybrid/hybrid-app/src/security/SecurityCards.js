import React, { forwardRef } from 'react';
import { DonutChart, ProgressCircle, Button, Legend, LineChart, Callout, AreaChart, Dialog, DialogPanel } from '@tremor/react';

const getProgressColor = (value) => {
    if (value > 90) {
        return "green";
    } else if (value > 50) {
        return "orange";
    } else {
        return "red";
    }
};

const disable = (critical) => {
    if (critical === 0) {
        return true;
    }
    else {
        return false;
    }
};

export function SecurityIntroCard({score, sectionRef,  onClick}) {
    const variab = () => {
        if (score === 100) {
            return {disabled: true, param:"Security Score is great!", grade:"Grade A"};
        }
        else if (score > 90) {
            return {disabled: false, param: "Security Score is good, but some actions are needed", grade: "Grade A-"};
        }
        else if (score > 85) {
            return {disabled: false, param: "Average security score, consider taking some actions", grade: "Grade B"};
        }
        else if (score > 75) {
            return {disabled: false, param: "Security score is below average, urgent action needed", grade: "Grade C"};
        }
        else {
            return {disabled: false, param: "Poor score!!!, take action now!", grade:"Grade D"};
        }
    }

    const {disabled: disable, param: para, grade: grade} = variab();

    const handleClick = () => {
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (onClick) {
            onClick(); 
        }
    };

    return (
        <div className='dark:bg-gray-200 p-4 rounded-md bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
            <h3 className='text-mono text-center font-medium text-lg'>Security Score</h3>
            <div className='items-center m-2'>
                <ProgressCircle
                    value={score}
                    size="md"
                    color={getProgressColor(score)}
                    strokeWidth={10}
                    radius={40}
                    className='mt-2 ml-5 mr-5 mb-2'
                >
                <span className="text-sm font-medium text-slate-700">{score}%</span>
                </ProgressCircle>
            </div>
            <p className='mb-2 text-white'>{para}<span className='ml-1' style={{color: getProgressColor(score)}}>{grade}</span></p>
            <div className='flex justify-center'>
                <Button disabled={disable? disable : false} color='red' onClick={handleClick}> Veiw Actions</Button>
            </div>
        </div>
    );
}

export function SecurityChart({data}) {
    return (
        <div className='dark:bg-gray-200 pl-8 pr-8 pt-1 pb-4 rounded-md'>
            <h3 className='text-mono text-center mt-2 font-medium text-lg'>Tests Analysis</h3>
            <div className="flex flex-col items-center gap-2 ">
                <DonutChart
                    data={data}
                    variant="pie"
                    onValueChange={(v) => console.log(v)}
                    className="w-24"
                    category="value"
                    index="name"
                    colors={['red', 'orange', 'yellow', 'gray']}
                />
                <Legend
                    categories={["critical", 'medium', 'low', 'informational']}
                    colors={['red', 'orange', 'yellow', 'gray']}
                    className='mt-0 '
                />
            </div>
        </div>
    );
}

export function Cards({ critical, type, color, className, sectionRef, onClick }) {
    const disabled = disable(critical);

    const handleClick = () => {
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (onClick) {
            onClick(); 
        }
    };

    return (
        <Button className='w-48 m-0' color={color} disabled={disabled} onClick={handleClick}>
            <h3 className='text-mono text-center m-4 font-medium text-xs'>{type}
                <span className={className}>{critical}</span></h3>
        </Button>
    );
}


export function SecurityAllLine({data, title}) {
    return (
        <div className='dark:bg-gray-200 pl-8 pr-8 pt-1 pb-4 rounded-md '>
            <h3 className='text-left font-bold text-lg'>{title}</h3>
            <LineChart 
                className="h-52 w-62"
                data={data}
                index="time"
                categories={['issues', 'mitigated']}
                colors={['blue-700', 'fuchsia-700']}
                showGridLines="false"
                yAxisWidth={30}
            />
        </div>
    );
}

export function SecurityTypeLine({data, title}) {
    return (
        <div className='dark:bg-gray-200 pl-8 pr-8 pt-1 pb-4 rounded-md '>
            <h3 className='text-left font-bold text-lg'>{title}</h3>
            <AreaChart 
                className="h-52 w-62"
                data={data}
                index="time"
                categories={['high', 'medium', 'low', 'informational']}
                colors={['red', 'orange', 'yellow', 'gray']}
                showGridLines="false"
                yAxisWidth={30}
            />
        </div>
    );
}

export function SecurityVulnerabilityCard({title, valOne, valTwo, valThree, info1, info2, info3, onClick, sectionRef}) {
    const handleClick = () => {
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (onClick) {
            onClick(); 
        }
    };
    return (
        <div className='dark:bg-gray-200 pl-8 pr-8 pt-1 pb-1 w-64 rounded-md bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
            <h3 className='text-mono text-center font-medium text-base mt-2'>{title}</h3>
                <div className='flex flex-row'>
                    <ol className='list-disc text-left m-2 text-sm text-white'>
                        <li>{info1}</li>
                        <li>{info2}</li>
                        <li>{info3}</li>
                    </ol>
                    <ol>
                        <li>
                            <span className='inline-flex items-center justify-center w-2 h-2 p-2 ms-2 text-xs font-medium text-gray-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-white'>{valOne}</span> 
                        </li>
                        <li>
                            <span className='inline-flex items-center justify-center w-2 h-2 p-2 ms-2 text-xs font-medium text-gray-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-white'>{valTwo}</span>
                        </li>
                        <li>
                            <span className='inline-flex items-center justify-center w-2 h-2 p-2 ms-2 text-xs font-medium text-gray-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-white'>{valThree}</span>
                        </li>
                    </ol>
                </div>
            <Button variant='secondary' color='white' className='mt-2' onClick={handleClick}>More info</Button>
        </div>
    );
}

export function CalloutHero({info, color, title, risk, other}) {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className='mb-2'> 
            <Callout title={title} color={color}>
                <div className='flex flex-col text-left ml-2 text-white'>
                    {info}
                    <Button color={color}  className='w-10 h-5 text-xs mt-2' onClick={() => setIsOpen(true)}>view</Button>
                    <Dialog
                        open={isOpen}
                        onClose={() => setIsOpen(false)}
                        static={true}
                        className="z-[100]"
                    >
                        <DialogPanel className="max-w-sm">
                            <h3 style={{color:color}}>{risk}</h3>
                            <p>{other}</p>
                            <Button
                                variant="light"
                                className="mx-auto flex items-center"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogPanel>
                    </Dialog>
                </div>
            </Callout>
        </div>
    );
}

export function SecurityLog({ data }) {
    if (!data || data.length === 0) {
        return (
            <CalloutHero
                title="No risks found"
                color="green"
                time={new Date().toLocaleString()}
            />
        );
    }

    return (
        <div className='mx-auto bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
            {data
                .slice()
                .reverse()
                .map((item, index) => {
                    let color;
                    switch (item.risk) {
                        case 'High':
                            color = 'red';
                            break;
                        case 'Medium':
                            color = 'orange';
                            break;
                        case 'Low':
                            color = 'yellow';
                            break;
                        case 'Informational':
                            color = 'gray';
                            break;
                        default:
                            color = 'blue'; 
                    }

                    return (
                        <CalloutHero
                            key={index}
                            title={item.risk}
                            risk={item.name}
                            color={color}
                            info={item.name}
                            other={item.solution}
                        />
                    );
                })}
        </div>
    );
}


const extractHostName = (url) => {
    try {
        const { hostname } = new URL(url);
        return hostname;
    } catch (e) {
        // Handle invalid URLs if needed
        return url;
    }
};

function SecurityInfo({ data, color }) {
    const references = data.reference.split(/\s+/);

    return (
        <div className='text-left text-mono mb-2 bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
            <Callout title={data.name} color={color}>
                <div className='ml-4 text-orange-950'>
                    <p className='mb-2'>
                        <strong>CWE ID:</strong> {data.cweid} 
                        <strong className='ml-6'>WASC ID:</strong> {data.wascid}
                        <strong className='ml-6'>Risk Alert:</strong> <em className='text-rose-600'>{data.confidence}</em>
                    </p>
                    <h6><strong>Description:</strong></h6>
                    <p className='ml-4 mb-2 text-white'>{data.description}</p>
                    <p className='ml-4 mb-2'>
                        <strong>Reference:</strong>
                        <span className='ml-2'>
                            {references.map((url, index) => {
                                const hostname = extractHostName(url);
                                return (
                                    <span key={index} className='ml-2'>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className='text-white hover:underline'>
                                            {hostname}
                                        </a>
                                    </span>
                                );
                            })}
                        </span>
                    </p>
                    {data.evidence && data.evidence.trim() !== '' && (
                        <div>
                            <h6><strong>Evidence:</strong></h6> 
                            <p className='ml-4 mb-2 text-white'>{data.evidence}</p>
                        </div>
                    )}
                    <h6><strong>Action to take:</strong></h6>
                    <p className='text-white ml-4'>{data.solution}</p>         
                </div>
            </Callout>
        </div>
    );
}

export const SecurityRisks = forwardRef(({ data, color, type }, ref) => {
    if (!data || data.length === 0) return null;

    const latestResults = data[data.length - 1];

    const latestResultsFlat = Array.isArray(latestResults)
        ? latestResults.flat()
        : [];

    const latestResultsSet = new Set(latestResultsFlat.map(alert => alert.alertRef));

    const previousResults = data.slice(0, -1).flat().filter(item => !latestResultsSet.has(item.alertRef));

    return (
        <div className='flex flex-col dark:bg-slate-300 rounded-md bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-90%' ref={ref}>
            <div className='text-mono dark:bg-gray-200 m-2 p-2 rounded-md bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
                <h3 className='text-center font-bold text-lg' style={{color: color}}>{type}</h3>
                <h3 className='text-left font-medium text-base m-2'><em>New Risks</em></h3>
                    {latestResultsFlat.map((item, index) => (
                        <SecurityInfo key={index} data={item} color={color} />
                    ))}
            </div>
            {previousResults.length > 0 && (
                <div className='p-4 text-mono dark:bg-gray-200 m-2 p-2 rounded-md bg-gradient-to-r from-emerald-500 from-10% via-sky-500 via-30% to-indigo-500 to-90%'>
                    <h3 className='text-left font-medium text-base'><em>Previous Raised Risks</em></h3>
                
                    {previousResults.map((item, index) => (
                        <SecurityInfo key={index} data={item} color={color} />
                    ))}
                </div>
            )}

        </div>
    );
});

