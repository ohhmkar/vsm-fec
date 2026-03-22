'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Activity,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { Modal } from '@/components/ui/Modal';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { formatCurrency, formatPercent } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { transactions, resetPortfolio, holdings, cash } = usePortfolioStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [liveSimulation, setLiveSimulation] = useState(true);
  const [pnlFormat, setPnlFormat] = useState<'dollar' | 'percent'>('percent');

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DT';

  // Calculate stats
  const stats = useMemo(() => {
    const totalTrades = transactions.length;
    const buyTrades = transactions.filter((t) => t.type === 'BUY');
    const sellTrades = transactions.filter((t) => t.type === 'SELL');

    // Win rate: check sells that were profitable
    let wins = 0;
    let losses = 0;
    let biggestGain = 0;
    let biggestLoss = 0;

    sellTrades.forEach((sell) => {
      const buys = buyTrades.filter((b) => b.ticker === sell.ticker && b.timestamp < sell.timestamp);
      if (buys.length > 0) {
        const avgBuyPrice = buys.reduce((s, b) => s + b.price, 0) / buys.length;
        const pnl = (sell.price - avgBuyPrice) * sell.shares;
        if (pnl > 0) {
          wins++;
          biggestGain = Math.max(biggestGain, pnl);
        } else {
          losses++;
          biggestLoss = Math.min(biggestLoss, pnl);
        }
      }
    });

    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    return { totalTrades, winRate, biggestGain, biggestLoss };
  }, [transactions]);

  const handleReset = () => {
    resetPortfolio();
    setShowResetModal(false);
  };

  // Recent activity
  const recentActivity = transactions.slice(0, 10);

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-green)] flex items-center justify-center text-xl font-bold text-white">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-[var(--text-dim)]">
                  Member since {user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-medium flex items-center gap-1">
                  <ShieldCheck size={10} />
                  Demo Trader
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Trades', value: stats.totalTrades.toString(), icon: Target, color: 'text-[var(--accent-blue)]' },
            { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: Trophy, color: 'text-[var(--accent-gold)]' },
            { label: 'Biggest Gain', value: stats.biggestGain > 0 ? `+${formatCurrency(stats.biggestGain)}` : '—', icon: TrendingUp, color: 'text-[var(--accent-green)]' },
            { label: 'Biggest Loss', value: stats.biggestLoss < 0 ? formatCurrency(stats.biggestLoss) : '—', icon: TrendingDown, color: 'text-[var(--accent-red)]' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={stat.color} />
                  <span className="text-xs text-[var(--text-dim)]">{stat.label}</span>
                </div>
                <p className={`text-lg font-semibold font-mono tabular-nums ${stat.color}`}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
        >
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-5 flex items-center gap-2">
            <Settings size={16} />
            Settings
          </h3>
          <div className="space-y-4">
            {/* P&L Format */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">P&L Display</div>
                <div className="text-xs text-[var(--text-dim)]">Show profit/loss as dollar or percentage</div>
              </div>
              <div className="flex bg-[var(--bg-elevated)] rounded-lg p-0.5">
                <button
                  onClick={() => setPnlFormat('dollar')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    pnlFormat === 'dollar' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-dim)]'
                  }`}
                >
                  $
                </button>
                <button
                  onClick={() => setPnlFormat('percent')}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    pnlFormat === 'percent' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-dim)]'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {/* Live Simulation */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Live Price Simulation</div>
                <div className="text-xs text-[var(--text-dim)]">Simulate real-time price updates</div>
              </div>
              <button
                onClick={() => setLiveSimulation(!liveSimulation)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  liveSimulation ? 'bg-[var(--accent-green)]' : 'bg-[var(--border-color)]'
                }`}
              >
                <motion.div
                  animate={{ x: liveSimulation ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                />
              </button>
            </div>

            {/* Reset Portfolio */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
              <div>
                <div className="text-sm font-medium text-[var(--accent-red)]">Reset Portfolio</div>
                <div className="text-xs text-[var(--text-dim)]">Reset cash to $100K and clear all holdings</div>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--accent-red)]/30 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        {recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
              <Activity size={16} />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]/50"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'BUY'
                        ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                        : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]'
                    }`}
                  >
                    {tx.type === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className={`font-medium ${tx.type === 'BUY' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {tx.type === 'BUY' ? 'Bought' : 'Sold'}
                      </span>{' '}
                      <span className="font-mono">{tx.shares}</span> shares of{' '}
                      <span className="font-mono font-medium">{tx.ticker}</span>
                    </div>
                    <div className="text-xs text-[var(--text-dim)]">
                      {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-sm">{formatCurrency(tx.total)}</div>
                    <div className="text-xs text-[var(--text-dim)] font-mono">@ {formatCurrency(tx.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Portfolio?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            This will reset your cash to $100,000 and clear all holdings and transaction history. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-lg bg-[var(--accent-red)] text-white text-sm font-medium hover:brightness-110 transition-all"
            >
              Reset Portfolio
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
