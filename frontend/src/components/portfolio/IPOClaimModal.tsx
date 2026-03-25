"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { formatCurrency } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface PendingIPO {
  symbol: string;
  quantity: number;
  price: number;
  round: number;
}

export function IPOClaimModal() {
  const user = useAuthStore((s) => s.user);
  const syncWithBackend = usePortfolioStore((s) => s.syncWithBackend);
  const [pendingIPO, setPendingIPO] = useState<PendingIPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPendingIPO = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/game/ipo/pending`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "Success" && Array.isArray(data.data)) {
        setPendingIPO(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch pending IPO", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingIPO();
  }, [fetchPendingIPO]);

  const handleClaim = async (symbol: string) => {
    if (!user?.id) return;
    setClaiming(symbol);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/game/ipo/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        await syncWithBackend();
        setPendingIPO((prev) => prev.filter((p) => p.symbol !== symbol));
      } else {
        setError(data.message || "Failed to claim IPO shares");
      }
    } catch (_err) {
      setError("Network error claiming IPO shares");
    } finally {
      setClaiming(null);
    }
  };

  if (loading || pendingIPO.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b border-[var(--border-color)] bg-[var(--accent-blue)]/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center">
                <Award size={24} className="text-[var(--accent-blue)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">IPO Shares Available</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  You have been allocated IPO shares for the following stocks
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {pendingIPO.map((ipo) => (
              <div
                key={ipo.symbol}
                className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{ipo.symbol}</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      IPO Price: {formatCurrency(ipo.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[var(--accent-green)]">
                      {ipo.quantity} shares
                    </div>
                    <div className="text-sm text-[var(--text-dim)]">
                      Total: {formatCurrency(ipo.quantity * ipo.price)}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 p-2 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-lg text-[var(--accent-red)] text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="text-xs text-[var(--text-dim)] mb-3 p-2 bg-[var(--bg-base)] rounded-lg">
                  These shares will be locked until Round {ipo.round + 1}. You
                  cannot sell them until then.
                </div>

                <button
                  onClick={() => handleClaim(ipo.symbol)}
                  disabled={claiming !== null}
                  className="w-full py-2.5 bg-[var(--accent-green)] text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {claiming === ipo.symbol ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Claim IPO Shares
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
