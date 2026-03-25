"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Vault,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  CandlestickChart,
  ChevronDown,
  ChevronUp,
  ScrollText,
  Lock,
} from "lucide-react";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useMarketStore } from "@/store/marketStore";
import { useAuthStore } from "@/store/authStore";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { listVariants, itemVariants } from "@/components/ui/PageWrapper";
import { formatCurrency, formatPercent } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface IPOClaimedSymbols {
  [symbol: string]: {
    locked: boolean;
    unlockRound?: number;
  };
}

export default function PortfolioPage() {
  const {
    cash,
    holdings,
    transactions,
    snapshots,
    getTotalValue,
    getTotalPnL,
  } = usePortfolioStore();
  const stocks = useMarketStore((s) => s.stocks);
  const user = useAuthStore((s) => s.user);
  const [showTransactions, setShowTransactions] = useState(false);
  const [ipoLockedSymbols, setIpoLockedSymbols] = useState<Set<string>>(
    new Set(),
  );
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    const fetchIPOStatus = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${BACKEND_URL}/game/info/game-info`, {
          headers: { Authorization: `Bearer ${user.id}` },
        });
        const data = await res.json();
        if (data.status === "Success") {
          setCurrentRound(data.data.roundNo || 1);
        }
      } catch (err) {
        console.error("Failed to fetch game info", err);
      }
    };

    const fetchLockedStocks = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${BACKEND_URL}/admin/players`, {
          headers: { Authorization: `Bearer ${user.id}` },
        });
        const data = await res.json();
        if (data.status === "Success" && data.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentUser = data.data.find((p: any) => p.id === user.id);
          if (currentUser?.ipoLockedSymbols) {
            const locked = new Set(currentUser.ipoLockedSymbols as string[]);
            setIpoLockedSymbols(locked);
          }
        }
      } catch (err) {
        console.error("Failed to fetch IPO status", err);
      }
    };

    fetchIPOStatus();
    fetchLockedStocks();
    const interval = setInterval(fetchIPOStatus, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const totalValue = getTotalValue();
  const { dollar: totalPnLDollar, percent: totalPnLPercent } = getTotalPnL();
  const holdingsValue = holdings.reduce((s, h) => s + h.marketValue, 0);

  const summaryCards = [
    {
      label: "Total Portfolio Value",
      value: formatCurrency(totalValue),
      icon: Vault,
      color: "text-[var(--accent-blue)]",
    },
    {
      label: "Total P&L",
      value: `${totalPnLDollar >= 0 ? "+" : ""}${formatCurrency(totalPnLDollar)} (${formatPercent(totalPnLPercent)})`,
      icon: totalPnLDollar >= 0 ? ArrowUpRight : ArrowDownRight,
      color:
        totalPnLDollar >= 0
          ? "text-[var(--accent-green)]"
          : "text-[var(--accent-red)]",
    },
    {
      label: "Available Cash",
      value: formatCurrency(cash),
      icon: Coins,
      color: "text-[var(--accent-gold)]",
    },
    {
      label: "Positions",
      value: holdings.length.toString(),
      icon: CandlestickChart,
      color: "text-[var(--text-primary)]",
    },
  ];

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Your holdings and performance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className={card.color} />
                  <span className="text-xs text-[var(--text-dim)]">
                    {card.label}
                  </span>
                </div>
                <p
                  className={`text-lg font-semibold font-mono tabular-nums ${card.color}`}
                >
                  {card.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Portfolio Performance Chart */}
        {snapshots.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
              Portfolio Performance
            </h3>
            <div className="h-[250px]">
              <PortfolioChart data={snapshots} />
            </div>
          </motion.div>
        )}

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Holdings {holdings.length > 0 && `(${holdings.length})`}
            </h3>
          </div>

          {holdings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[var(--text-dim)] mb-2">No holdings yet</p>
              <Link
                href="/stocks"
                className="text-sm text-[var(--accent-blue)] hover:underline"
              >
                Browse stocks to start trading →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-dim)] text-xs">
                    <th className="text-left py-3 px-5 font-medium">Ticker</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">
                      Company
                    </th>
                    <th className="text-right py-3 px-4 font-medium">Shares</th>
                    <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">
                      Avg Cost
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Current
                    </th>
                    <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">
                      Mkt Value
                    </th>
                    <th className="text-right py-3 px-4 font-medium">P&L</th>
                    <th className="text-center py-3 px-5 font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {holdings.map((h) => {
                    const isLocked = ipoLockedSymbols.has(h.ticker);
                    return (
                      <motion.tr
                        key={h.ticker}
                        variants={itemVariants}
                        className={`border-b border-[var(--border-color)]/50 transition-colors ${isLocked ? "bg-[var(--accent-gold)]/5" : "hover:bg-[var(--bg-elevated)]/50"}`}
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/stocks/${h.ticker}`}
                              className="font-mono font-semibold text-[var(--accent-blue)] hover:underline"
                            >
                              {h.ticker}
                            </Link>
                            {isLocked && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] rounded font-medium">
                                <Lock size={10} />
                                LOCKED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] text-xs hidden md:table-cell">
                          {h.name}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {h.shares}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)] hidden sm:table-cell">
                          {formatCurrency(h.avgCost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {formatCurrency(h.currentPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums hidden sm:table-cell">
                          {formatCurrency(h.marketValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div
                            className={`font-mono tabular-nums text-xs ${h.pnl >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}
                          >
                            {h.pnl >= 0 ? "+" : ""}
                            {formatCurrency(h.pnl)}
                          </div>
                          <ChangeIndicator
                            value={h.pnlPercent}
                            size="sm"
                            showIcon={false}
                          />
                        </td>
                        <td className="py-3 px-5 text-center">
                          {isLocked ? (
                            <span className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-dim)] rounded-lg">
                              Locked until R{currentRound + 1}
                            </span>
                          ) : (
                            <Link
                              href={`/stocks/${h.ticker}`}
                              className="px-3 py-1.5 text-xs font-medium bg-[var(--accent-red)]/10 text-[var(--accent-red)] rounded-lg hover:bg-[var(--accent-red)]/20 transition-colors"
                            >
                              Sell
                            </Link>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-elevated)]/30 transition-colors"
            >
              <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <ScrollText size={14} />
                Transaction History ({transactions.length})
              </span>
              {showTransactions ? (
                <ChevronUp size={16} className="text-[var(--text-dim)]" />
              ) : (
                <ChevronDown size={16} className="text-[var(--text-dim)]" />
              )}
            </button>

            <AnimatePresence>
              {showTransactions && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="overflow-x-auto border-t border-[var(--border-color)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-dim)] text-xs">
                          <th className="text-left py-3 px-5 font-medium">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Type
                          </th>
                          <th className="text-left py-3 px-4 font-medium">
                            Ticker
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Shares
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            Price
                          </th>
                          <th className="text-right py-3 px-5 font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 20).map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-[var(--border-color)]/50"
                          >
                            <td className="py-2.5 px-5 text-xs text-[var(--text-dim)] font-mono">
                              {new Date(tx.timestamp).toLocaleDateString()}{" "}
                              {new Date(tx.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  tx.type === "BUY"
                                    ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                                    : "bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-xs">
                              {tx.ticker}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs">
                              {tx.shares}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs">
                              {formatCurrency(tx.price)}
                            </td>
                            <td className="py-2.5 px-5 text-right font-mono tabular-nums text-xs font-medium">
                              {formatCurrency(tx.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
