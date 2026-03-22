'use client';

import { useMemo, useId } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface MiniSparklineProps {
  data: { close: number }[];
  isPositive: boolean;
  className?: string;
}

export function MiniSparkline({ data, isPositive, className }: MiniSparklineProps) {
  const chartId = useId();
  // Ensure we have at least some data
  const safeData = data || [];
  const last20 = useMemo(() => safeData.slice(-20).map((d, i) => ({ i, v: d.close })), [safeData]);
  const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
  
  if (last20.length < 2) return <div className="bg-gray-100/5 rounded animate-pulse w-full h-full" />;

  // Normalize ID for SVG compatibility
  const gradientId = `mini-grad-${chartId.replace(/:/g, '')}`;

  return (
    <div className={className || "h-full w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={last20}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}