'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, Banknote, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMarketStore } from '@/store/marketStore';
import { PageWrapper } from '@/components/ui/PageWrapper';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function PowerUpsPage() {
  const user = useAuthStore((s) => s.user);
  const stocks = useMarketStore((s) => s.stocks);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Stock betting states
  const [betAmount, setBetAmount] = useState<string>('');
  const [betPrediction, setBetPrediction] = useState<'UP' | 'DOWN'>('UP');
  const [betSymbol, setBetSymbol] = useState<string>('');

  const triggerPowerUp = async (type: string, payload?: any) => {
    if (!user?.id) return;
    setLoading(type);
    setMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/game/powerup/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await res.json();
      if (res.ok && data.status === 'Success') {
        setMessage({ text: data.message || `Power-up ${type} activated!`, type: 'success' });
      } else {
        setMessage({ text: data.message || 'Failed to activate power-up', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Network error activating power-up', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Zap className="text-[var(--accent-purple)] fill-[var(--accent-purple)]/20" size={24} />
            Event Power-Ups
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Activate special advantages in the game. Use them wisely!
          </p>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl flex items-center gap-3 border ${
                message.type === 'success' 
                  ? 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20 text-[var(--accent-green)]'
                  : 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20 text-[var(--accent-red)]'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insider Trading */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Eye size={120} className="text-[var(--accent-blue)]" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center mb-4 border border-[var(--accent-blue)]/20">
                <Eye className="text-[var(--accent-blue)]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Insider Trading</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">
                Receive an exclusive piece of upcoming market news before anyone else. This gives you a critical edge to buy or sell preemptively.
              </p>
              <button
                disabled={loading !== null}
                onClick={() => triggerPowerUp('insider-trading')}
                className="w-full py-3 px-4 rounded-xl bg-[var(--accent-blue)] text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading === 'insider-trading' ? 'Activating...' : 'Activate Insider Info'}
              </button>
            </div>
          </div>

          {/* Muft Ka Paisa */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Banknote size={120} className="text-[var(--accent-green)]" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/10 flex items-center justify-center mb-4 border border-[var(--accent-green)]/20">
                <Banknote className="text-[var(--accent-green)]" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Free Money (Muft Ka Paisa)</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">
                Instantly receive a random cash injection into your portfolio. The market gods are feeling generous!
              </p>
              <button
                disabled={loading !== null}
                onClick={() => triggerPowerUp('muft-ka-paisa')}
                className="w-full py-3 px-4 rounded-xl bg-[var(--accent-green)] text-black font-medium hover:bg-green-500 transition-colors disabled:opacity-50"
              >
                {loading === 'muft-ka-paisa' ? 'Activating...' : 'Claim Free Cash'}
              </button>
            </div>
          </div>
        </div>

        {/* Stock Betting */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple)]/10 flex-shrink-0 flex items-center justify-center border border-[var(--accent-purple)]/20">
              <HelpCircle className="text-[var(--accent-purple)]" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Stock Prediction Bet</h3>
              <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
                Lock your cash into a prediction. If the stock moves in your predicted direction in the next round, you win big! If you're wrong, you lose the bet amount.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border-color)]">
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-medium">Select Stock</label>
              <select
                value={betSymbol}
                onChange={(e) => setBetSymbol(e.target.value)}
                className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-purple)]"
              >
                <option value="" disabled>Select Ticker</option>
                {stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-medium">Prediction</label>
              <select
                value={betPrediction}
                onChange={(e) => setBetPrediction(e.target.value as any)}
                className={`w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-sm font-medium outline-none ${
                    betPrediction === 'UP' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                }`}
              >
                <option value="UP" className="text-[var(--accent-green)]">Bullish (UP)</option>
                <option value="DOWN" className="text-[var(--accent-red)]">Bearish (DOWN)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-medium">Bet Amount ($)</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg text-sm font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-purple)]"
              />
            </div>

            <div className="flex items-end">
              <button
                disabled={loading !== null || !betSymbol || !betAmount || isNaN(Number(betAmount))}
                onClick={() => triggerPowerUp('stock-betting', { 
                  stockBettingAmount: Number(betAmount), 
                  stockBettingPrediction: betPrediction, 
                  stockBettingLockedSymbol: betSymbol 
                })}
                className="w-full p-3 rounded-lg bg-[var(--accent-purple)] text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 h-[46px]"
              >
                {loading === 'stock-betting' ? 'Placing Bet...' : 'Place Prediction Bet'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  );
}
