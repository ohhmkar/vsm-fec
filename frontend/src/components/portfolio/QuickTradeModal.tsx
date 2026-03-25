"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Wallet, ArrowRightLeft, Loader2 } from "lucide-react";
import { Stock } from "@/types";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useMarketStore } from "@/store/marketStore";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { clsx } from "clsx";
import { useNotificationStore } from "@/store/notificationStore";

interface QuickTradeModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

type TradeType = "BUY" | "SELL";

export function QuickTradeModal({ stock, isOpen, onClose }: QuickTradeModalProps) {
  const [tradeType, setTradeType] = useState<TradeType>("BUY");
  const [quantityStr, setQuantityStr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { cash, holdings, executeTrade, syncWithBackend } = usePortfolioStore();
  const { stocks: liveStocks } = useMarketStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  // Get freshest price from store just in case
  const liveStock = liveStocks.find(s => s.ticker === stock.ticker) || stock;
  const currentPrice = liveStock.price;
  
  const holding = holdings.find(h => h.ticker === stock.ticker);
  const ownedShares = holding?.shares || 0;

  const quantity = parseInt(quantityStr) || 0;
  const totalCost = quantity * currentPrice;
  
  const canBuy = quantity > 0 && totalCost <= cash;
  const canSell = quantity > 0 && quantity <= ownedShares;
  const isValid = tradeType === "BUY" ? canBuy : canSell;

  const handleMax = () => {
    if (tradeType === "BUY") {
      const maxShares = Math.floor(cash / currentPrice);
      setQuantityStr(maxShares.toString());
    } else {
      setQuantityStr(ownedShares.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    try {
      // Use the store's executeTrade which calls the backend
      
      const result = await executeTrade(
        stock.ticker, 
        stock.name, 
        quantity, 
        currentPrice, 
        tradeType
      );

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${stock.ticker}`,
          timestamp: Date.now()
        });
        await syncWithBackend();
        onClose();
        setQuantityStr("");
      } else {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: result.message || 'Trade failed',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'An unexpected error occurred',
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-(--bg-card) border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold font-mono">{stock.ticker}</h2>
              <p className="text-xs text-[var(--text-secondary)]">{stock.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-[var(--bg-elevated)] rounded-full transition-colors"
            >
              <X size={20} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Trade Tabs */}
          <div className="flex bg-[var(--bg-elevated)] p-1 m-4 rounded-xl">
            {(["BUY", "SELL"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTradeType(type);
                  setQuantityStr("");
                }}
                className={clsx(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                  tradeType === type
                    ? type === "BUY"
                      ? "bg-[var(--accent-green)] text-white shadow-sm"
                      : "bg-[var(--accent-red)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
            {/* Price Info */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Current Price</span>
              <span className="font-mono font-bold text-lg">{formatCurrency(currentPrice)}</span>
            </div>

            {/* Wallet / Holding Info */}
            <div className="flex justify-between items-center text-xs bg-[var(--bg-elevated)] p-3 rounded-lg">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Wallet size={12} />
                {tradeType === "BUY" ? "Buying Power" : "Owned Shares"}
              </span>
              <span className="font-mono font-medium">
                {tradeType === "BUY" 
                  ? formatCurrency(cash) 
                  : `${ownedShares} shares`
                }
              </span>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Quantity</label>
                <button 
                  type="button" 
                  onClick={handleMax}
                  className="text-xs text-[var(--accent-blue)] font-medium hover:underline"
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantityStr}
                  onChange={(e) => setQuantityStr(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl py-3 px-4 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/50 transition-all"
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-sm pt-2 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)]">Total Estimate</span>
              <span className="font-mono font-bold text-lg">{formatCurrency(totalCost)}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={clsx(
                "w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                !isValid || isLoading
                  ? "bg-[var(--bg-elevated)] text-[var(--text-dim)] cursor-not-allowed"
                  : tradeType === "BUY"
                    ? "bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white shadow-lg shadow-green-900/20"
                    : "bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/90 text-white shadow-lg shadow-red-900/20"
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {tradeType === "BUY" ? "Confirm Buy" : "Confirm Sell"}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
