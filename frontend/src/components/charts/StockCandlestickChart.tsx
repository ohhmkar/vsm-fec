'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
} from 'recharts';
import { OHLCV } from '@/types';

interface StockChartProps {
  data: OHLCV[];
  timeframe?: string;
}

interface CandleData extends OHLCV {
  fill: string;
  wickHigh: number;
  wickLow: number;
  bodyTop: number;
  bodyBottom: number;
  bodyHeight: number;
}

export function StockCandlestickChart({ data, timeframe = 'ALL' }: StockChartProps) {
  const filtered = useMemo(() => {
    const minsMap: Record<string, number> = { '30M': 30, '1H': 60, '2H': 120, 'ALL': 180 };
    const mins = minsMap[timeframe] || 180;
    return data.slice(-mins);
  }, [data, timeframe]);

  // For a simpler, reliable rendering use a line chart with high/low range + volume bars
  const chartData = useMemo(() => {
    return filtered.map((d) => ({
      ...d,
      isUp: d.close >= d.open,
      range: [d.low, d.high],
    }));
  }, [filtered]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Price chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
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
              tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
              labelFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                const v = Number(value);
                if (name === 'close') return [`$${v.toFixed(2)}`, 'Close'];
                if (name === 'high') return [`$${v.toFixed(2)}`, 'High'];
                if (name === 'low') return [`$${v.toFixed(2)}`, 'Low'];
                return [value, name];
              }}
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke="var(--text-dim)"
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 4"
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke="var(--text-dim)"
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 4"
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="var(--accent-blue)"
              strokeWidth={2}
              dot={false}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume bars */}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 'auto']} />
            <Bar dataKey="volume" animationDuration={1500}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
                  opacity={0.3}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
