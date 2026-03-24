'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Zap, DollarSign, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMarketStore } from '@/store/marketStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface GameInfo {
  roundNo: number;
  isRoundActive: boolean;
  stage: string;
}

export function RoundInfoBanner() {
  const user = useAuthStore((s) => s.user);
  const isConnected = useMarketStore((s) => s.isConnected);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/game/info/game-info`);
        const data = await res.json();
        if (data.status === 'Success') {
          setGameInfo(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch game info', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameInfo();
    const interval = setInterval(fetchGameInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gameInfo?.isRoundActive) return;

    const updateTimer = () => {
      const now = Date.now();
      const endTime = localStorage.getItem('roundEndTime');
      if (endTime) {
        const remaining = parseInt(endTime) - now;
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('0:00');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameInfo?.isRoundActive]);

  if (loading || !gameInfo) return null;

  if (!gameInfo.isRoundActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)]/20 flex items-center justify-center">
            <Clock size={20} className="text-[var(--accent-gold)]" />
          </div>
          <div>
            <p className="font-medium">Waiting for Round {gameInfo.roundNo + 1}</p>
            <p className="text-xs text-[var(--text-dim)]">Trading will begin when admin starts the round</p>
          </div>
        </div>
        {!isConnected && (
          <div className="flex items-center gap-2 text-xs text-[var(--accent-red)]">
            <AlertCircle size={14} />
            Reconnecting...
          </div>
        )}
      </motion.div>
    );
  }

  const getRoundRules = (roundNo: number) => {
    const rules = [];
    if (roundNo === 1) {
      rules.push({ icon: TrendingUp, label: 'BUY ONLY', color: 'text-[var(--accent-blue)]' });
    }
    if (roundNo === 3) {
      rules.push({ icon: DollarSign, label: 'DIVIDENDS', color: 'text-[var(--accent-green)]' });
    }
    if (roundNo === 5) {
      rules.push({ icon: Zap, label: 'IPO', color: 'text-[var(--accent-gold)]' });
    }
    if (rules.length === 0) {
      rules.push({ icon: TrendingUp, label: 'FULL TRADING', color: 'text-[var(--accent-green)]' });
    }
    return rules;
  };

  const rules = getRoundRules(gameInfo.roundNo);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-surface)] border border-[var(--accent-blue)]/30 rounded-xl p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">{gameInfo.roundNo}</span>
          </div>
          <div>
            <p className="font-bold text-lg">Round {gameInfo.roundNo} Active</p>
            <div className="flex items-center gap-2 mt-1">
              {rules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <span
                    key={index}
                    className={`flex items-center gap-1 text-xs font-medium ${rule.color} bg-[var(--bg-elevated)] px-2 py-1 rounded`}
                  >
                    <Icon size={12} />
                    {rule.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRemaining && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-dim)]">Time Remaining</p>
              <p className="font-mono font-bold text-xl text-[var(--accent-red)]">{timeRemaining}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'}`}></span>
            </span>
            <span className="text-xs font-medium">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
