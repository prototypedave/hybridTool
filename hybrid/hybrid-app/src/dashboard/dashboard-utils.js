import React, { useState } from "react";
import { AgCharts } from "ag-charts-react";
import "ag-charts-enterprise";

export const Waterfall = ({data}) => {
    const [options, setOptions] = useState({
        data: data,
        title: {
            text: "Metrics Score",
        },
        subtitle: {
            text: "All values in ms",
        },
        series: [
            {
                type: "waterfall",
                xKey: "metric",
                xName: "Metrics",
                yKey: "score",
                yName: "Time",
            },
        ],
    });
  
    return <AgCharts options={options} />;
};