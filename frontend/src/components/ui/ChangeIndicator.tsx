'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';

interface ChangeIndicatorProps {
  value: number;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ChangeIndicator({
  value,
  showIcon = true,
  className,
  size = 'md',
}: ChangeIndicatorProps) {
  const isPositive = value >= 0;
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };
  const iconSize = { sm: 10, md: 12, lg: 16 };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center rounded-md font-mono font-medium tabular-nums',
        sizeClasses[size],
        isPositive
          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
          : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]',
        className
      )}
    >
      {showIcon &&
        (isPositive ? (
          <TrendingUp size={iconSize[size]} />
        ) : (
          <TrendingDown size={iconSize[size]} />
        ))}
      {formatPercent(value)}
    </motion.span>
  );
}
