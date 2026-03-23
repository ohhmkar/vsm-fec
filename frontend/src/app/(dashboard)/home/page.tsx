"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  DollarSign,
  Zap,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useMarketStore } from "@/store/marketStore";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { RoundInfoBanner } from "@/components/ui/RoundInfoBanner";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { itemVariants, listVariants } from "@/components/ui/PageWrapper";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import {
  formatCompactCurrency,
  formatVolume,
  formatCurrency,
} from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const stocks = useMarketStore((s) => s.stocks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cycleInterval = 8000;

  useEffect(() => {
    if (stocks.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stocks.length);
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [stocks.length, isPaused]);

  const currentStock = stocks[currentIndex];

  const sorted = useMemo(
    () => [...stocks].sort((a, b) => b.changePercent - a.changePercent),
    [stocks],
  );
  const topGainers = sorted.slice(0, 3);
  const topLosers = sorted.slice(-3).reverse();

  const totalMarketCap = stocks.reduce((s, st) => s + st.marketCap, 0);
  const totalVolume = stocks.reduce((s, st) => s + st.volume, 0);
  const advancing = stocks.filter((s) => s.changePercent >= 0).length;
  const declining = stocks.filter((s) => s.changePercent < 0).length;
  const mostActive = [...stocks].sort((a, b) => b.volume - a.volume)[0];

  const sectors = useMemo(() => {
    const sectorMap = new Map<
      string,
      { totalCap: number; weightedChange: number }
    >();
    stocks.forEach((s) => {
      const existing = sectorMap.get(s.sector) || {
        totalCap: 0,
        weightedChange: 0,
      };
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

  const nextStock = () => {
    setCurrentIndex((prev) => (prev + 1) % stocks.length);
  };

  const prevStock = () => {
    setCurrentIndex((prev) => (prev - 1 + stocks.length) % stocks.length);
  };

  return (
    <PageWrapper>
      <NewsTicker />
      <RoundInfoBanner />
      <div className="space-y-6">
        {/* Stock Cycling Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevStock}
                className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-[var(--text-dim)] font-mono">
                {currentIndex + 1} / {stocks.length}
              </span>
              <button
                onClick={nextStock}
                className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg transition-colors text-[var(--text-secondary)]"
              title={isPaused ? 'Resume cycling' : 'Pause cycling'}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>

          {currentStock && (
            <Link href={`/stocks/${currentStock.ticker}`}>
              <motion.div
                key={currentStock.ticker}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl font-bold font-mono">
                        {currentStock.ticker}
                      </span>
                      <span className="text-sm text-[var(--text-dim)] px-2 py-0.5 bg-[var(--bg-elevated)] rounded">
                        {currentStock.sector}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {currentStock.name}
                    </p>
                  </div>
                  <div className="flex items-end gap-6">
                    <div className="flex-1 min-w-[200px] h-20">
                      <MiniSparkline
                        data={currentStock.history}
                        isPositive={currentStock.changePercent >= 0}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold font-mono tabular-nums">
                        {formatCurrency(currentStock.price)}
                      </div>
                      <ChangeIndicator value={currentStock.changePercent} size="md" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--bg-elevated)] rounded-xl">
                  <div>
                    <div className="text-xs text-[var(--text-dim)] mb-1">Day High</div>
                    <div className="font-mono font-medium">
                      {formatCurrency(currentStock.dayHigh)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-dim)] mb-1">Day Low</div>
                    <div className="font-mono font-medium">
                      {formatCurrency(currentStock.dayLow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-dim)] mb-1">Volume</div>
                    <div className="font-mono font-medium">
                      {formatVolume(currentStock.volume)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-dim)] mb-1">Market Cap</div>
                    <div className="font-mono font-medium">
                      {formatCompactCurrency(currentStock.marketCap)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          )}

          {/* Stock Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {stocks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-[var(--accent-blue)] w-4'
                    : 'bg-[var(--border-color)] hover:bg-[var(--text-dim)]'
                }`}
              />
            ))}
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
            {
              label: "Total Market Cap",
              value: formatCompactCurrency(totalMarketCap),
              icon: DollarSign,
            },
            {
              label: "24h Volume",
              value: formatVolume(totalVolume),
              icon: BarChart3,
            },
            {
              label: "Advancing",
              value: advancing.toString(),
              icon: TrendingUp,
              color: "text-[var(--accent-green)]",
            },
            {
              label: "Declining",
              value: declining.toString(),
              icon: TrendingDown,
              color: "text-[var(--accent-red)]",
            },
            {
              label: "Most Active",
              value: mostActive?.ticker || "-",
              icon: Zap,
              color: "text-[var(--accent-gold)]",
            },
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
                  <Icon
                    size={14}
                    className={stat.color || "text-[var(--text-dim)]"}
                  />
                  <span className="text-xs text-[var(--text-dim)]">
                    {stat.label}
                  </span>
                </div>
                <p
                  className={`text-lg font-semibold font-mono tabular-nums ${stat.color || ""}`}
                >
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
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {topGainers.map((stock) => (
                <motion.div key={stock.ticker} variants={itemVariants}>
                  <Link
                    href={`/stocks/${stock.ticker}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-semibold text-sm">
                        {stock.ticker}
                      </span>
                      <span className="text-xs text-[var(--text-dim)] ml-2">
                        {stock.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-sm">
                        {formatCurrency(stock.price)}
                      </div>
                      <ChangeIndicator
                        value={stock.changePercent}
                        size="sm"
                        showIcon={false}
                      />
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
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {topLosers.map((stock) => (
                <motion.div key={stock.ticker} variants={itemVariants}>
                  <Link
                    href={`/stocks/${stock.ticker}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-semibold text-sm">
                        {stock.ticker}
                      </span>
                      <span className="text-xs text-[var(--text-dim)] ml-2">
                        {stock.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-sm">
                        {formatCurrency(stock.price)}
                      </div>
                      <ChangeIndicator
                        value={stock.changePercent}
                        size="sm"
                        showIcon={false}
                      />
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
                  title={`${sector.name}: ${sector.change >= 0 ? "+" : ""}${sector.change.toFixed(2)}%`}
                >
                  <div className="text-xs text-[var(--text-secondary)] mb-1 truncate">
                    {sector.name}
                  </div>
                  <div
                    className={`text-sm font-mono font-semibold tabular-nums ${
                      isPositive
                        ? "text-[var(--accent-green)]"
                        : "text-[var(--accent-red)]"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {sector.change.toFixed(2)}%
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