'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MarketIndexChartProps {
  data: { date: string; value: number }[];
  timeframe?: string;
}

export function MarketIndexChart({ data, timeframe = 'ALL' }: MarketIndexChartProps) {
  const filtered = useMemo(() => {
    const minsMap: Record<string, number> = { '30M': 30, '1H': 60, '2H': 120, 'ALL': 180 };
    const mins = minsMap[timeframe] || 180;
    return data.slice(-mins);
  }, [data, timeframe]);

  const isPositive = filtered.length >= 2 && filtered[filtered.length - 1].value >= filtered[0].value;
  const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={filtered} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--border-color)' }}
          tickLine={false}
          tickFormatter={(v) => {
            const d = new Date(v);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }}
          interval={Math.floor(filtered.length / 6)}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={55}
          tickFormatter={(v) => v.toFixed(0)}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
          labelFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [Number(v).toFixed(2), 'FEC Index']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#indexGradient)"
          animationDuration={2000}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
