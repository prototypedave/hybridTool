import React from 'react';
import { AreaChart, LineChart } from '@tremor/react';
import { useState } from 'react';

export function ContinuousAreaChart  ({ data }) {
    return (
        <div>
            <p className='text-left font-mono text-sm text-slate-500 ml-0'>hourly performance</p>
            <AreaChart
                data={data}
                categories={['mobile', 'desktop']}
                index="time"
                colors={["blue", "red"]}
                yAxisWidth={30}
                className='mt-4 w-80 h-52 mt-0'
            />
        </div>
    );
}

export function PerformanceLineChart({data}) {
    return (
      <>
        <LineChart
          className="h-52"
          data={data}
          index="time"
          categories={[
            'si',
            'lcp',
            'fcp',
            'tbt',
          ]}
          colors={['blue-700', 'fuchsia-700', '#f0652f']}
          showGridLines="false"
          yAxisWidth={30}
        />
      </>
    );
  }
  
  