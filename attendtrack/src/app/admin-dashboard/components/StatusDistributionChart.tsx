'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StatusDataPoint {
  day: string;
  onTime: number;
  late: number;
  absent: number;
}

interface StatusDistributionChartProps {
  data: StatusDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={`bar-tip-${entry.name}`} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.fill }} />
            {entry.name}
          </span>
          <span className="font-bold font-tabular text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="onTime" name="On Time" fill="var(--accent)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="late" name="Late" fill="var(--warning)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="absent" name="Absent" fill="var(--danger)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}