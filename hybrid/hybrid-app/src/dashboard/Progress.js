import React, { PureComponent } from 'react';
import { Card, ProgressCircle } from '@tremor/react';
import { AreaChart as AreaC, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export class PerfArea extends PureComponent {
render (data) {
return (
<ResponsiveContainer  width="100%" height="100%">
<AreaC width={600} height={300} data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                isAnimationActive={false}>
                    
                
                <XAxis dataKey="time" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area type="monotone" dataKey="mobile" stroke="#8884d8" fillOpacity={1} fill="#8884d8" />
                <Area type="monotone" dataKey="desktop" stroke="#82ca9d" fillOpacity={1} fill="#82ca9d" />
                </AreaC>
</ResponsiveContainer>
)
}
}