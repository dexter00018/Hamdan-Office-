'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceTrendChartProps {
  data: TrendDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={`tip-${entry.name}`} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground capitalize">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold font-tabular text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
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
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#gradPresent)"
          name="Present"
        />
        <Area
          type="monotone"
          dataKey="late"
          stroke="var(--warning)"
          strokeWidth={2}
          fill="url(#gradLate)"
          name="Late"
        />
        <Area
          type="monotone"
          dataKey="absent"
          stroke="var(--danger)"
          strokeWidth={2}
          fill="url(#gradAbsent)"
          name="Absent"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}