"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import { useMarketStore } from "@/store/marketStore";
import { ChangeIndicator } from "@/components/ui/ChangeIndicator";
import {
  PageWrapper,
  listVariants,
  itemVariants,
} from "@/components/ui/PageWrapper";
import {
  formatCurrency,
  formatCompactCurrency,
  formatVolume,
} from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { clsx } from "clsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MiniSparkline } from "@/components/charts/MiniSparkline";

type SortField = "ticker" | "price" | "changePercent" | "volume" | "marketCap";
type SortDir = "asc" | "desc";
type ViewType = "table" | "grid";

const SECTORS = [
  "Technology",
  "Energy",
  "Healthcare",
  "Finance",
  "Industrials",
  "Consumer Discretionary",
  "Materials",
  "Communication",
  "Real Estate",
];

export default function StocksPage() {
  const router = useRouter();
  const { stocks, isConnected } = useMarketStore();

  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("table");
  const [sortField, setSortField] = useState<SortField>("marketCap"); // Default sort by Market Cap
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(
        field === "marketCap" || field === "volume" || field === "price"
          ? "desc"
          : "asc",
      );
    }
  };

  const filtered = useMemo(() => {
    let result = stocks.filter(
      (s) =>
        (s.ticker.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase())) &&
        (!selectedSector || s.sector === selectedSector),
    );

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      const multiplier = sortDir === "asc" ? 1 : -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * multiplier;
      }
      return ((aVal as number) - (bVal as number)) * multiplier;
    });
    return result;
  }, [stocks, search, selectedSector, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return (
        <ArrowUpDown
          size={14}
          className="ml-1 text-[var(--text-dim)] opacity-50"
        />
      );
    return sortDir === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-[var(--accent-blue)]" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-[var(--accent-blue)]" />
    );
  };

  if (!isConnected && stocks.length === 0) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-[var(--text-secondary)]">
            Connecting to market...
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Market</h1>
            <p className="text-[var(--text-secondary)]">
              Track and trade {stocks.length} real-time instruments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[var(--bg-elevated)]/30 p-4 rounded-xl border border-[var(--border-color)]">
            <div className="flex flex-1 gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs group">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent-blue)] transition-colors"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ticker or company..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] outline-none transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sector Filter Dropdown (Simple implementation) */}
              <div className="relative hidden md:block">
                <select
                  value={selectedSector || ""}
                  onChange={(e) => setSelectedSector(e.target.value || null)}
                  className="h-full px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm outline-none focus:border-[var(--accent-blue)] cursor-pointer appearance-none pr-8"
                >
                  <option value="">All Sectors</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1 self-end sm:self-auto">
              <button
                onClick={() => setView("table")}
                className={clsx(
                  "p-2 rounded-md transition-all",
                  view === "table"
                    ? "bg-[var(--accent-blue)] text-white shadow-sm"
                    : "text-[var(--text-dim)] hover:text-[var(--text-primary)]",
                )}
                title="List View"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView("grid")}
                className={clsx(
                  "p-2 rounded-md transition-all",
                  view === "grid"
                    ? "bg-[var(--accent-blue)] text-white shadow-sm"
                    : "text-[var(--text-dim)] hover:text-[var(--text-primary)]",
                )}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] border-dashed"
            >
              <p className="text-[var(--text-secondary)] mb-2">
                No stocks found matching your criteria
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedSector(null);
                }}
                className="text-[var(--accent-blue)] hover:underline text-sm font-medium"
              >
                Clear filters
              </button>
            </motion.div>
          ) : view === "table" ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-elevated)]/50 border-b border-[var(--border-color)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                      <th
                        className="text-left py-4 px-6 font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors group"
                        onClick={() => handleSort("ticker")}
                      >
                        <div className="flex items-center">
                          Ticker <SortIcon field="ticker" />
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 font-semibold hidden md:table-cell">
                        Company
                      </th>
                      <th
                        className="text-right py-4 px-6 font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors group"
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center justify-end">
                          Price <SortIcon field="price" />
                        </div>
                      </th>
                      <th
                        className="text-right py-4 px-6 font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors group"
                        onClick={() => handleSort("changePercent")}
                      >
                        <div className="flex items-center justify-end">
                          Change <SortIcon field="changePercent" />
                        </div>
                      </th>
                      <th className="text-right py-4 px-6 font-semibold hidden lg:table-cell">
                        Trend
                      </th>
                      <th
                        className="text-right py-4 px-6 font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors group hidden xl:table-cell"
                        onClick={() => handleSort("marketCap")}
                      >
                        <div className="flex items-center justify-end">
                          Mkt Cap <SortIcon field="marketCap" />
                        </div>
                      </th>
                      <th
                        className="text-right py-4 px-6 font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors group hidden sm:table-cell"
                        onClick={() => handleSort("volume")}
                      >
                        <div className="flex items-center justify-end">
                          Volume <SortIcon field="volume" />
                        </div>
                      </th>
                      <th className="text-center py-4 px-6 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filtered.map((stock) => (
                      <tr
                        key={stock.ticker}
                        onClick={() => router.push(`/stocks/${stock.ticker}`)}
                        className="group hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold font-mono text-[var(--text-primary)]">
                              {stock.ticker}
                            </span>
                            <span className="text-xs text-[var(--text-dim)] md:hidden">
                              {stock.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-[var(--text-primary)] truncate max-w-[200px]">
                              {stock.name}
                            </span>
                            <span className="text-xs text-[var(--text-dim)]">
                              {stock.sector}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-medium text-[var(--text-primary)]">
                          {formatCurrency(stock.price)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end">
                            <ChangeIndicator
                              value={stock.change}
                              percent={stock.changePercent}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden lg:table-cell">
                          <div className="flex justify-end">
                            <MiniSparkline
                              data={stock.history}
                              isPositive={stock.changePercent >= 0}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-[var(--text-secondary)] hidden xl:table-cell">
                          {formatCompactCurrency(stock.marketCap)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-[var(--text-secondary)] hidden sm:table-cell">
                          {formatCompactCurrency(stock.volume)}
                        </td>
                        <td
                          className="py-4 px-6 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/stocks/${stock.ticker}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)]/20 rounded-full transition-colors"
                          >
                            Trade
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              variants={listVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((stock) => (
                <motion.div
                  key={stock.ticker}
                  variants={itemVariants}
                  onClick={() => router.push(`/stocks/${stock.ticker}`)}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 hover:shadow-lg hover:border-[var(--accent-blue)]/30 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg font-mono">
                        {stock.ticker}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate w-32">
                        {stock.name}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                      {stock.sector}
                    </span>
                  </div>

                  <div className="flex justify-between items-end mb-4">
                    <span className="text-2xl font-bold font-mono">
                      {formatCurrency(stock.price)}
                    </span>
                    <ChangeIndicator
                      value={stock.change}
                      percent={stock.changePercent}
                    />
                  </div>

                  <div className="h-12 w-full mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline
                      data={stock.history}
                      isPositive={stock.changePercent >= 0}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-[var(--text-dim)] border-t border-[var(--border-color)] pt-3">
                    <span>Vol: {formatCompactCurrency(stock.volume)}</span>
                    <span>Link &rarr;</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
