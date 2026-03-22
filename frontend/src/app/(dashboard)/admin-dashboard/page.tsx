'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface PlayerData {
  id: string;
  name: string;
  email: string;
  bankBalance: number;
  totalPortfolioValue: number;
  stocks: { symbol: string; volume: number }[];
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect non-admins natively
  useEffect(() => {
    if (user && !user.email.includes('admin')) {
      router.push('/home');
    }
  }, [user, router]);

  const fetchPlayers = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/players`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (res.ok && data.status === 'Success') {
        setPlayers(data.data.sort((a: PlayerData, b: PlayerData) => (b.bankBalance + b.totalPortfolioValue) - (a.bankBalance + a.totalPortfolioValue)));
      } else {
        setError(data.message || 'Failed to load players');
      }
    } catch (err) {
      console.error(err);
      setError('Network error connecting to admin gateway');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user]);

  if (user && !user.email.includes('admin')) return null;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <ShieldAlert className="text-[var(--accent-red)]" size={24} />
              Admin Command Center
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Live monitoring of all player portfolios and holdings.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <Users size={16} className="text-[var(--text-dim)]" />
              <div className="text-sm font-medium">{players.length} Active Players</div>
            </div>
            <button
               onClick={() => fetchPlayers()}
               className="text-xs px-4 py-2 bg-[var(--accent-blue)] text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-xl text-[var(--accent-red)] text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/50 text-xs font-medium text-[var(--text-dim)] uppercase tracking-wider">
                  <th className="py-4 pl-6 pr-4">Player</th>
                  <th className="py-4 px-4 text-right">Bank Balance</th>
                  <th className="py-4 px-4 text-right">Stock Valuation</th>
                  <th className="py-4 px-4 text-right">Total Net Worth</th>
                  <th className="py-4 pr-6 pl-4">Current Holdings</th>
                </tr>
              </thead>
              <tbody>
                {loading && players.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-dim)] text-sm">
                      <span className="w-4 h-4 border-2 border-[var(--text-dim)] border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle" />
                      Decrypting player data...
                    </td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-dim)] text-sm">
                      No players registered in the simulation.
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {players.map((p, i) => {
                      const totalWorth = p.bankBalance + p.totalPortfolioValue;
                      const activeStocks = p.stocks.filter(s => s.volume > 0);

                      return (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={p.id}
                          className="border-b border-[var(--border-color)]/50 last:border-0 hover:bg-[var(--bg-elevated)]/30 transition-colors"
                        >
                          <td className="py-4 pl-6 pr-4">
                            <div className="font-medium text-[var(--text-primary)]">{p.name}</div>
                            <div className="text-xs text-[var(--text-dim)]">{p.email}</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-mono text-[var(--text-secondary)]">{formatCurrency(p.bankBalance)}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-mono text-[var(--text-secondary)]">{formatCurrency(p.totalPortfolioValue)}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-mono font-bold text-[var(--accent-green)]">{formatCurrency(totalWorth)}</span>
                          </td>
                          <td className="py-4 pr-6 pl-4">
                            <div className="flex flex-wrap gap-2">
                              {activeStocks.length > 0 ? (
                                activeStocks.map(s => (
                                  <div key={s.symbol} className="px-2 py-1 bg-[var(--bg-base)] border border-[var(--border-color)] rounded text-xs flex items-center gap-1.5 font-mono">
                                    <span className="text-[var(--text-primary)]">{s.symbol}</span>
                                    <span className="text-[var(--text-dim)]">x{s.volume}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-[var(--text-dim)] italic">No holdings</span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
