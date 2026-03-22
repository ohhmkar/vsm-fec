'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  DollarSign,
  Zap,
} from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import { MarketIndexChart } from '@/components/charts/MarketIndexChart';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { itemVariants, listVariants } from '@/components/ui/PageWrapper';
import { calculateIndexHistory, calculateMarketIndex, getSectors } from '@/lib/stockEngine';
import { formatCompactCurrency, formatVolume, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const TIMEFRAMES = ['1D', '1W', '1M', '3M'];

export default function HomePage() {
  const stocks = useMarketStore((s) => s.stocks);
  const [timeframe, setTimeframe] = useState('3M');

  const indexHistory = useMemo(() => calculateIndexHistory(stocks), [stocks]);
  const currentIndex = useMemo(() => calculateMarketIndex(stocks), [stocks]);
  const prevIndex = indexHistory.length >= 2 ? indexHistory[indexHistory.length - 2].value : currentIndex;
  const indexChange = currentIndex - prevIndex;
  const indexChangePercent = prevIndex !== 0 ? (indexChange / prevIndex) * 100 : 0;

  const sorted = useMemo(() => [...stocks].sort((a, b) => b.changePercent - a.changePercent), [stocks]);
  const topGainers = sorted.slice(0, 3);
  const topLosers = sorted.slice(-3).reverse();

  const totalMarketCap = stocks.reduce((s, st) => s + st.marketCap, 0);
  const totalVolume = stocks.reduce((s, st) => s + st.volume, 0);
  const advancing = stocks.filter((s) => s.changePercent >= 0).length;
  const declining = stocks.filter((s) => s.changePercent < 0).length;
  const mostActive = [...stocks].sort((a, b) => b.volume - a.volume)[0];

  // Sector performance
  const sectors = useMemo(() => {
    const sectorMap = new Map<string, { totalCap: number; weightedChange: number }>();
    stocks.forEach((s) => {
      const existing = sectorMap.get(s.sector) || { totalCap: 0, weightedChange: 0 };
      existing.totalCap += s.marketCap;
      existing.weightedChange += s.changePercent * s.marketCap;
      sectorMap.set(s.sector, existing);
    });
    return Array.from(sectorMap.entries()).map(([name, data]) => ({
      name,
      change: data.totalCap > 0 ? data.weightedChange / data.totalCap : 0,
      marketCap: data.totalCap,
    }));
  }, [stocks]);

  if (stocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--border-color)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero: Market Index Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-sm text-[var(--text-secondary)] mb-1">FEC Market Index</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold font-mono tabular-nums">
                  {currentIndex.toFixed(2)}
                </span>
                <ChangeIndicator value={indexChangePercent} size="md" />
              </div>
            </div>
            <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-[var(--accent-blue)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[320px]">
            <MarketIndexChart data={indexHistory} timeframe={timeframe} />
          </div>
        </motion.div>

        {/* Market Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          {[
            { label: 'Total Market Cap', value: formatCompactCurrency(totalMarketCap), icon: DollarSign },
            { label: '24h Volume', value: formatVolume(totalVolume), icon: BarChart3 },
            { label: 'Advancing', value: advancing.toString(), icon: TrendingUp, color: 'text-[var(--accent-green)]' },
            { label: 'Declining', value: declining.toString(), icon: TrendingDown, color: 'text-[var(--accent-red)]' },
            { label: 'Most Active', value: mostActive?.ticker || '—', icon: Zap, color: 'text-[var(--accent-gold)]' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={stat.color || 'text-[var(--text-dim)]'} />
                  <span className="text-xs text-[var(--text-dim)]">{stat.label}</span>
                </div>
                <p className={`text-lg font-semibold font-mono tabular-nums ${stat.color || ''}`}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gainers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-[var(--accent-green)] mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Top Gainers
            </h3>
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
              {topGainers.map((stock) => (
                <motion.div key={stock.ticker} variants={itemVariants}>
                  <Link
                    href={`/stocks/${stock.ticker}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                      <span className="text-xs text-[var(--text-dim)] ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-sm">{formatCurrency(stock.price)}</div>
                      <ChangeIndicator value={stock.changePercent} size="sm" showIcon={false} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Losers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-[var(--accent-red)] mb-4 flex items-center gap-2">
              <TrendingDown size={16} />
              Top Losers
            </h3>
            <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
              {topLosers.map((stock) => (
                <motion.div key={stock.ticker} variants={itemVariants}>
                  <Link
                    href={`/stocks/${stock.ticker}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                      <span className="text-xs text-[var(--text-dim)] ml-2">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-sm">{formatCurrency(stock.price)}</div>
                      <ChangeIndicator value={stock.changePercent} size="sm" showIcon={false} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Sector Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Activity size={16} />
            Sector Performance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {sectors.map((sector, i) => {
              const intensity = Math.min(Math.abs(sector.change) / 2, 1);
              const isPositive = sector.change >= 0;
              const bgColor = isPositive
                ? `rgba(0, 209, 122, ${0.08 + intensity * 0.2})`
                : `rgba(255, 71, 87, ${0.08 + intensity * 0.2})`;
              return (
                <motion.div
                  key={sector.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="rounded-lg p-4 border border-[var(--border-color)] hover:scale-[1.02] transition-transform cursor-default"
                  style={{ background: bgColor }}
                  title={`${sector.name}: ${sector.change >= 0 ? '+' : ''}${sector.change.toFixed(2)}%`}
                >
                  <div className="text-xs text-[var(--text-secondary)] mb-1 truncate">{sector.name}</div>
                  <div
                    className={`text-sm font-mono font-semibold tabular-nums ${
                      isPositive ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                    }`}
                  >
                    {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] mt-1">
                    {formatCompactCurrency(sector.marketCap)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
