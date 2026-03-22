'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMarketStore } from '@/store/marketStore';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { formatCurrency } from '@/lib/utils';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface LeaderboardEntry {
  rank: number;
  name: string;
  wealth: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);
  const socket = useMarketStore((s) => s.socket);

  const fetchLeaderboard = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/game/info/leaderboard`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.status === 'Success') {
        setLeaderboard(data.data);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  // Refetch when a round ends, and listen for live updates
  useEffect(() => {
    if (!socket) return;
    const handleRecalc = () => fetchLeaderboard();
    const handleLiveUpdate = (data: LeaderboardEntry[]) => setLeaderboard(data);
    
    socket.on('game:stage:CALCULATION_STAGE', handleRecalc);
    socket.on('leaderboard:update', handleLiveUpdate);
    
    return () => {
      socket.off('game:stage:CALCULATION_STAGE', handleRecalc);
      socket.off('leaderboard:update', handleLiveUpdate);
    };
  }, [socket]);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <Trophy className="text-[var(--accent-gold)]" size={24} />
              Global Leaderboard
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Real-time rankings based on total portfolio valuation
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--text-dim)]">Status</div>
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
              </span>
              <span className="text-xs font-mono font-medium text-[var(--accent-green)]">LIVE</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-xl flex items-center gap-3 text-[var(--accent-red)] text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-2xl relative min-h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-base)]/50 pointer-events-none z-0" />
            
            <table className="w-full text-left border-collapse relative z-10">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/50 text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                  <th className="py-4 pl-6 pr-4 w-20">Rank</th>
                  <th className="py-4 px-4">Trader / Team</th>
                  <th className="py-4 pr-6 pl-4 text-right">Total Wealth</th>
                </tr>
              </thead>
              <tbody className="relative">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-[var(--text-dim)]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[var(--text-dim)] border-t-transparent rounded-full animate-spin" />
                        Loading rankings...
                      </div>
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-[var(--text-dim)]">
                      No traders found.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {leaderboard.map((entry, idx) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          layout: { type: 'spring', stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 },
                        }}
                        key={entry.name}
                        className={`group border-b border-[var(--border-color)]/50 last:border-0 hover:bg-[var(--bg-elevated)]/30 transition-colors ${
                          entry.name === user?.name ? 'bg-[var(--accent-blue)]/5 hover:bg-[var(--accent-blue)]/10' : ''
                        }`}
                      >
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Medal className="text-[var(--accent-gold)] drop-shadow-[0_0_8px_rgba(245,166,35,0.5)]" size={20} />}
                            {idx === 1 && <Medal className="text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.3)]" size={20} />}
                            {idx === 2 && <Medal className="text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.2)]" size={20} />}
                            {idx > 2 && <span className="font-mono text-[var(--text-secondary)] pl-[2px]">#{entry.rank}</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-[var(--text-primary)] flex items-center gap-2">
                          {entry.name}
                          {entry.name === user?.name && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent-blue)] text-white ml-2">YOU</span>
                          )}
                        </td>
                        <td className="py-4 pr-6 pl-4 text-right">
                          <span className="font-mono tabular-nums font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                            {formatCurrency(entry.wealth)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
