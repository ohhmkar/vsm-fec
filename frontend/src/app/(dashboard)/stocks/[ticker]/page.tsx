'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Check,
  AlertCircle,
  Plus,
  Minus,
  Wallet,
  PieChart,
  DollarSign,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useMarketStore } from '@/store/marketStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { StockCandlestickChart } from '@/components/charts/StockCandlestickChart';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { Modal } from '@/components/ui/Modal';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatCompactCurrency, formatVolume } from '@/lib/utils';
import { clsx } from 'clsx';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string)?.toUpperCase();
  const { stocks, isConnected } = useMarketStore();
  const stock = stocks.find((s) => s.ticker === ticker);
  const { cash, holdings, executeTrade } = usePortfolioStore();

  const [timeframe, setTimeframe] = useState('ALL');
  const [tradeTab, setTradeTab] = useState<'BUY' | 'SELL'>('BUY');
  const [sharesStr, setSharesStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ success: boolean; message: string } | null>(null);

  const holding = holdings.find((h) => h.ticker === ticker);
  const sharesNum = parseInt(sharesStr) || 0;
  const currentPrice = stock?.price || 0;
  const totalCost = sharesNum * currentPrice;

  // Calculate max shares buyable/sellable
  const maxBuyable = currentPrice > 0 ? Math.floor(cash / currentPrice) : 0;
  const maxSellable = holding ? holding.shares : 0;

  const canBuy = tradeTab === 'BUY' && sharesNum > 0 && totalCost <= cash;
  const canSell = tradeTab === 'SELL' && sharesNum > 0 && holding && sharesNum <= holding.shares;
  const isValidTrade = tradeTab === 'BUY' ? canBuy : canSell;

  // Handlers
  const handleSetMax = () => {
    if (tradeTab === 'BUY') {
      setSharesStr(maxBuyable.toString());
    } else {
      setSharesStr(maxSellable.toString());
    }
  };

  const incrementShares = () => setSharesStr((prev) => ((parseInt(prev || '0') || 0) + 1).toString());
  const decrementShares = () => setSharesStr((prev) => Math.max(0, (parseInt(prev || '0') || 0) - 1).toString());

  const handleConfirmTrade = async () => {
    if (!stock || !isValidTrade || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await executeTrade(stock.ticker, stock.name, sharesNum, stock.price, tradeTab);
      setTradeResult(result);
      if (result.success) {
        setSharesStr('');
        setTimeout(() => setTradeResult(null), 3000);
      }
    } catch (e) {
      setTradeResult({ success: false, message: 'Trade failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!stock && !isConnected) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-[var(--text-secondary)]">Loading market data...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!stock && isConnected) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="w-12 h-12 text-[var(--accent-red)]" />
          <h2 className="text-xl font-bold">Stock Not Found</h2>
          <p className="text-[var(--text-secondary)]">The ticker symbol "{ticker}" does not exist.</p>
          <Link href="/stocks" className="text-[var(--accent-blue)] hover:underline">
            ← Back to Market
          </Link>
        </div>
      </PageWrapper>
    );
  }

  if (!stock) return null; // Should not happen

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
    { label: 'P/E Ratio', value: stock.peRatio.toFixed(2) },
  ];

  return (
    <PageWrapper>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-mono tracking-tight">{stock.ticker}</h1>
              <span className="text-xs font-medium text-[var(--text-dim)] px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                {stock.sector}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">{stock.name}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold tracking-tight font-mono">{formatCurrency(stock.price)}</div>
          <ChangeIndicator 
            value={stock.change} 
            percent={stock.changePercent} 
            className="justify-end text-lg"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chart & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Card */}
          <div className="card p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity size={18} className="text-[var(--accent-blue)]" />
                Price Action
              </h3>
              <div className="flex bg-[var(--bg-elevated)] rounded-lg p-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={clsx(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      timeframe === tf
                        ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[350px] w-full">
              <StockCandlestickChart data={stock.history} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 text-lg">Key Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-4">
              {statsGrid.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{stat.label}</span>
                  <span className="font-mono font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Trade & Position */}
        <div className="space-y-6">
          {/* Trade Card */}
          <div className="card p-6 sticky top-6">
            <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl mb-6">
              {(['BUY', 'SELL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setTradeTab(tab);
                    setSharesStr('');
                    setTradeResult(null);
                  }}
                  className={clsx(
                    "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
                    tradeTab === tab
                      ? tab === 'BUY' 
                        ? "bg-[var(--accent-green)] text-white shadow-lg shadow-green-900/20" 
                        : "bg-[var(--accent-red)] text-white shadow-lg shadow-red-900/20"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {tab} {stock.ticker}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="flex justify-between items-center text-sm px-1">
                <span className="text-[var(--text-secondary)]">
                  {tradeTab === 'BUY' ? 'Buying Power' : 'Available Shares'}
                </span>
                <span className="font-mono font-medium">
                  {tradeTab === 'BUY' 
                    ? formatCurrency(cash) 
                    : `${holding?.shares || 0} shares`
                  }
                </span>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={decrementShares} className="p-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-colors">
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={sharesStr}
                      onChange={(e) => setSharesStr(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-[var(--accent-blue)] rounded-lg px-4 py-2.5 text-center font-mono font-bold text-lg outline-none transition-all placeholder:text-[var(--text-dim)]"
                    />
                    <button 
                      onClick={handleSetMax}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 px-2 py-1 rounded"
                    >
                      MAX
                    </button>
                  </div>
                  <button onClick={incrementShares} className="p-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[var(--bg-elevated)] rounded-xl p-4 space-y-3 border border-[var(--border-color)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Price per share</span>
                  <span className="font-mono">{formatCurrency(stock.price)}</span>
                </div>
                <div className="h-px bg-[var(--border-color)]" />
                <div className="flex justify-between items-end">
                  <span className="text-[var(--text-secondary)] font-medium">Estimated Total</span>
                  <span className="text-xl font-bold font-mono tracking-tight">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
              
              {/* Validation Errors */}
              {!isValidTrade && sharesNum > 0 && (
                  <p className="text-xs text-red-500 text-center animate-pulse">
                      {tradeTab === 'BUY' ? 'Insufficient funds' : 'Insufficient shares'}
                  </p>
              )}

              {/* Action Button */}
              <button
                onClick={handleConfirmTrade}
                disabled={!isValidTrade || isSubmitting}
                className={clsx(
                  "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
                  !isValidTrade 
                    ? "opacity-50 cursor-not-allowed bg-[var(--bg-elevated)] text-[var(--text-dim)]"
                    : tradeTab === 'BUY'
                      ? "bg-[var(--accent-green)] hover:brightness-110 text-white shadow-lg shadow-green-900/20 active:scale-[0.98]"
                      : "bg-[var(--accent-red)] hover:brightness-110 text-white shadow-lg shadow-red-900/20 active:scale-[0.98]"
                )}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="border-white" />
                ) : (
                  <>
                    {tradeTab === 'BUY' ? 'Buy' : 'Sell'} {stock.ticker}
                  </>
                )}
              </button>

              {/* Feedback Message */}
              <AnimatePresence>
                {tradeResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={clsx(
                      "p-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      tradeResult.success 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {tradeResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                    {tradeResult.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Your Position Card */}
          {holding && holding.shares > 0 && (
            <div className="card p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
                <Wallet size={18} />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Your Position</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Shares Owned</div>
                  <div className="font-mono font-bold text-xl">{holding.shares}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Market Value</div>
                  <div className="font-mono font-bold text-xl">{formatCurrency(holding.marketValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Avg Cost</div>
                  <div className="font-mono font-medium">{formatCurrency(holding.avgCost)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Total Return</div>
                  <ChangeIndicator value={holding.pnl} percent={holding.pnlPercent} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}