'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface PortfolioChartProps {
  data: { timestamp: number; totalValue: number }[];
  indexData?: { date: string; value: number }[];
  showBenchmark?: boolean;
}

export function PortfolioChart({ data, indexData, showBenchmark = false }: PortfolioChartProps) {
  const chartData = data.map((d, i) => ({
    date: new Date(d.timestamp).toLocaleDateString(),
    value: d.totalValue,
    index: indexData && indexData[i] ? indexData[i].value : undefined,
  }));

  const isPositive = chartData.length >= 2 && chartData[chartData.length - 1].value >= chartData[0].value;
  const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'var(--border-color)' }}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={65}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => {
            const val = Number(v);
            if (name === 'value') return [`$${val.toFixed(2)}`, 'Portfolio'];
            if (name === 'index') return [val.toFixed(2), 'FEC Index'];
            return [v, name];
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#portfolioGradient)"
          animationDuration={2000}
        />
        {showBenchmark && (
          <Line
            type="monotone"
            dataKey="index"
            stroke="var(--accent-gold)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
