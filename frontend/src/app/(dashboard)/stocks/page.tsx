'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { listVariants, itemVariants } from '@/components/ui/PageWrapper';
import { formatCurrency, formatCompactCurrency, formatVolume } from '@/lib/utils';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

type SortField = 'ticker' | 'price' | 'changePercent' | 'volume' | 'marketCap';
type SortDir = 'asc' | 'desc';
type ViewType = 'table' | 'grid';

function MiniSparkline({ data, isPositive }: { data: { close: number }[]; isPositive: boolean }) {
  const last30 = data.slice(-30).map((d, i) => ({ i, v: d.close }));
  const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={last30}>
        <defs>
          <linearGradient id={`mini-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#mini-${isPositive})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function StocksPage() {
  const stocks = useMarketStore((s) => s.stocks);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewType>('table');
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'ticker' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    let result = stocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.sector.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [stocks, search, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-[var(--text-dim)]" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-[var(--accent-blue)]" />
    ) : (
      <ArrowDown size={12} className="text-[var(--accent-blue)]" />
    );
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
            <p className="text-sm text-[var(--text-secondary)]">{stocks.length} instruments available</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stocks..."
                className="pl-9 pr-4 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-blue)] outline-none w-48 sm:w-64 transition-colors"
              />
            </div>
            {/* View Toggle */}
            <div className="flex bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-0.5">
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'table' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'grid' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-dim)] text-xs">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th
                      className="text-left py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('ticker')}
                    >
                      <span className="flex items-center gap-1">Ticker <SortIcon field="ticker" /></span>
                    </th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Company</th>
                    <th
                      className="text-right py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('price')}
                    >
                      <span className="flex items-center justify-end gap-1">Price <SortIcon field="price" /></span>
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium cursor-pointer select-none"
                      onClick={() => handleSort('changePercent')}
                    >
                      <span className="flex items-center justify-end gap-1">Change <SortIcon field="changePercent" /></span>
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium cursor-pointer select-none hidden lg:table-cell"
                      onClick={() => handleSort('volume')}
                    >
                      <span className="flex items-center justify-end gap-1">Volume <SortIcon field="volume" /></span>
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium cursor-pointer select-none hidden lg:table-cell"
                      onClick={() => handleSort('marketCap')}
                    >
                      <span className="flex items-center justify-end gap-1">Mkt Cap <SortIcon field="marketCap" /></span>
                    </th>
                    <th className="text-center py-3 px-4 font-medium hidden sm:table-cell">Sector</th>
                    <th className="text-center py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <motion.tbody variants={listVariants} initial="hidden" animate="show">
                  {filtered.map((stock, i) => (
                    <motion.tr
                      key={stock.ticker}
                      variants={itemVariants}
                      className="border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-elevated)]/50 transition-colors group"
                    >
                      <td className="py-3 px-4 text-[var(--text-dim)] font-mono text-xs">{i + 1}</td>
                      <td className="py-3 px-4">
                        <Link href={`/stocks/${stock.ticker}`} className="font-mono font-semibold text-[var(--accent-blue)] hover:underline">
                          {stock.ticker}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] hidden md:table-cell text-xs">{stock.name}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(stock.price)}</td>
                      <td className="py-3 px-4 text-right">
                        <ChangeIndicator value={stock.changePercent} size="sm" showIcon={false} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)] hidden lg:table-cell text-xs">
                        {formatVolume(stock.volume)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[var(--text-secondary)] hidden lg:table-cell text-xs">
                        {formatCompactCurrency(stock.marketCap)}
                      </td>
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <span className="text-xs text-[var(--text-dim)] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)]">
                          {stock.sector}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/stocks/${stock.ticker}`}
                          className="px-3 py-1.5 text-xs font-medium bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] rounded-lg hover:bg-[var(--accent-blue)]/20 transition-colors"
                        >
                          Trade
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Grid View */}
        {view === 'grid' && (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((stock) => (
              <motion.div key={stock.ticker} variants={itemVariants}>
                <Link
                  href={`/stocks/${stock.ticker}`}
                  className="block bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 hover:border-[var(--accent-blue)]/30 hover:scale-[1.01] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-mono text-lg font-bold">{stock.ticker}</div>
                      <div className="text-xs text-[var(--text-dim)] truncate max-w-[160px]">{stock.name}</div>
                    </div>
                    <span className="text-[10px] text-[var(--text-dim)] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)]">
                      {stock.sector}
                    </span>
                  </div>
                  <div className="h-10 mb-3">
                    <MiniSparkline data={stock.history} isPositive={stock.changePercent >= 0} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="font-mono tabular-nums text-xl font-semibold">{formatCurrency(stock.price)}</span>
                    <ChangeIndicator value={stock.changePercent} size="sm" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
