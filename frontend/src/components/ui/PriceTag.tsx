'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PriceTagProps {
  value: number;
  className?: string;
  prefix?: string;
  decimals?: number;
}

export function PriceTag({ value, className, prefix = '$', decimals = 2 }: PriceTagProps) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}`);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span
      className={cn('font-mono tabular-nums', className)}
    >
      {display}
    </motion.span>
  );
}
