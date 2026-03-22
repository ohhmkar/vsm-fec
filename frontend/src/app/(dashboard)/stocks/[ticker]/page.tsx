'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMarketStore } from '@/store/marketStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { StockCandlestickChart } from '@/components/charts/StockCandlestickChart';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { Modal } from '@/components/ui/Modal';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { formatCurrency, formatCompactCurrency, formatVolume } from '@/lib/utils';

const TIMEFRAMES = ['30M', '1H', '2H', 'ALL'];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string)?.toUpperCase();
  const stocks = useMarketStore((s) => s.stocks);
  const stock = stocks.find((s) => s.ticker === ticker);
  const { cash, holdings, executeTrade } = usePortfolioStore();

  const [timeframe, setTimeframe] = useState('ALL');
  const [tradeTab, setTradeTab] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ success: boolean; message: string } | null>(null);

  const holding = holdings.find((h) => h.ticker === ticker);
  const sharesNum = parseInt(shares) || 0;
  const totalCost = stock ? sharesNum * stock.price : 0;

  const canBuy = sharesNum > 0 && totalCost <= cash;
  const canSell = sharesNum > 0 && holding && sharesNum <= holding.shares;

  const handleConfirmTrade = async () => {
    if (!stock) return;
    const result = await executeTrade(stock.ticker, stock.name, sharesNum, stock.price, tradeTab);
    setTradeResult(result);
    setShowConfirm(false);
    setShares('');
    setTimeout(() => setTradeResult(null), 3000);
  };

  if (!stock) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-[var(--text-secondary)]">Stock not found</p>
          <Link href="/stocks" className="text-[var(--accent-blue)] hover:underline text-sm">
            ← Back to Stocks
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const statsGrid = [
    { label: 'Open', value: formatCurrency(stock.open) },
    { label: 'Day High', value: formatCurrency(stock.dayHigh) },
    { label: 'Day Low', value: formatCurrency(stock.dayLow) },
    { label: 'Prev Close', value: formatCurrency(stock.previousClose) },
    { label: '52W High', value: formatCurrency(stock.high52w) },
    { label: '52W Low', value: formatCurrency(stock.low52w) },
    { label: 'Volume', value: formatVolume(stock.volume) },
    { label: 'Avg Volume', value: formatVolume(stock.avgVolume) },
    { label: 'Market Cap', value: formatCompactCurrency(stock.marketCap) },
    { label: 'P/E Ratio', value: stock.peRatio.toFixed(1) },
  ];

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{stock.ticker}</h1>
            <span className="text-xs text-[var(--text-dim)] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)]">
              {stock.sector}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(stock.price)}</div>
          <div className="flex items-center gap-2 justify-end">
            <span className={`font-mono tabular-nums text-sm ${stock.change >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
              {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
            </span>
            <ChangeIndicator value={stock.changePercent} size="sm" />
          </div>
        </div>
      </div>

      {/* Trade result toast */}
      <AnimatePresence>
        {tradeResult && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-20 left-1/2 z-50 px-4 py-3 rounded-xl border flex items-center gap-2 text-sm font-medium shadow-2xl ${
              tradeResult.success
                ? 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/30 text-[var(--accent-green)]'
                : 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/30 text-[var(--accent-red)]'
            }`}
          >
            {tradeResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
            {tradeResult.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Chart + Stats */}
        <div className="lg:w-[65%] space-y-4">
          {/* Chart */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Price Chart</h3>
              <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
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
            <div className="h-[360px]">
              <StockCandlestickChart data={stock.history} timeframe={timeframe} />
            </div>
          </div>

          {/* Key Stats */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Key Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {statsGrid.map((stat) => (
                <div key={stat.label}>
                  <div className="text-xs text-[var(--text-dim)] mb-1">{stat.label}</div>
                  <div className="font-mono tabular-nums text-sm font-medium">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Trade Panel */}
        <div className="lg:w-[35%]">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 lg:sticky lg:top-[80px]">
            {/* Buy/Sell Tabs */}
            <div className="flex bg-[var(--bg-elevated)] rounded-lg p-0.5 mb-5">
              <button
                onClick={() => setTradeTab('BUY')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  tradeTab === 'BUY'
                    ? 'bg-[var(--accent-green)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <TrendingUp size={14} />
                Buy
              </button>
              <button
                onClick={() => setTradeTab('SELL')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  tradeTab === 'SELL'
                    ? 'bg-[var(--accent-red)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <TrendingDown size={14} />
                Sell
              </button>
            </div>

            {/* Current Price */}
            <div className="mb-5 p-3 rounded-lg bg-[var(--bg-elevated)]">
              <div className="text-xs text-[var(--text-dim)] mb-1">Market Price</div>
              <div className="text-xl font-bold font-mono tabular-nums">{formatCurrency(stock.price)}</div>
            </div>

            {/* Shares Input */}
            <div className="mb-4">
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Number of Shares</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min="1"
                placeholder="0"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono tabular-nums text-lg focus:border-[var(--accent-blue)] outline-none transition-colors"
              />
            </div>

            {/* Calculated total */}
            <div className="mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-dim)]">
                  {tradeTab === 'BUY' ? 'Total Cost' : 'Total Proceeds'}
                </span>
                <span className="font-mono tabular-nums font-medium">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-dim)]">Available Cash</span>
                <span className="font-mono tabular-nums text-[var(--accent-green)]">{formatCurrency(cash)}</span>
              </div>
              {holding && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-dim)]">Current Holdings</span>
                  <span className="font-mono tabular-nums">{holding.shares} shares</span>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={tradeTab === 'BUY' ? !canBuy : !canSell}
              className={`w-full py-3 rounded-lg font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                tradeTab === 'BUY'
                  ? 'bg-[var(--accent-green)] hover:brightness-110'
                  : 'bg-[var(--accent-red)] hover:brightness-110'
              }`}
            >
              {tradeTab === 'BUY' ? 'Buy' : 'Sell'} {stock.ticker}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Trade"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Action</span>
              <span className={`font-medium ${tradeTab === 'BUY' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                {tradeTab}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Stock</span>
              <span className="font-mono">{stock.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Shares</span>
              <span className="font-mono tabular-nums">{sharesNum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-dim)]">Price</span>
              <span className="font-mono tabular-nums">{formatCurrency(stock.price)}</span>
            </div>
            <div className="border-t border-[var(--border-color)] pt-2 flex justify-between font-medium">
              <span>Total</span>
              <span className="font-mono tabular-nums">{formatCurrency(totalCost)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmTrade}
              className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-all ${
                tradeTab === 'BUY'
                  ? 'bg-[var(--accent-green)] hover:brightness-110'
                  : 'bg-[var(--accent-red)] hover:brightness-110'
              }`}
            >
              Confirm {tradeTab}
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
