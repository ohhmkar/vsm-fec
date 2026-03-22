'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Holding, Transaction, PortfolioSnapshot } from '@/types';
import { generateId } from '@/lib/utils';
import { useAuthStore } from './authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

const STARTING_CASH = 100000;

interface PortfolioStore {
  cash: number;
  holdings: Holding[];
  transactions: Transaction[];
  snapshots: PortfolioSnapshot[];
  executeTrade: (
    ticker: string,
    name: string,
    shares: number,
    price: number,
    type: 'BUY' | 'SELL'
  ) => Promise<{ success: boolean; message: string }>;
  updateHoldingPrices: (prices: Record<string, number>) => void;
  syncWithBackend: () => Promise<void>;
  resetPortfolio: () => void;
  getTotalValue: () => number;
  getTotalPnL: () => { dollar: number; percent: number };
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      cash: STARTING_CASH,
      holdings: [],
      transactions: [],
      snapshots: [{ timestamp: Date.now(), totalValue: STARTING_CASH }],

      syncWithBackend: async () => {
        try {
          const token = useAuthStore.getState().user?.id;
          if (!token) return;

          const res = await fetch(`${BACKEND_URL}/game/info/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();

          if (data.status === 'Success') {
            const cash = data.data.bankBalance;
            const backendHoldings: any[] = data.data.portfolio;
            
            // Map backend simple portfolio ({ name, volume, value, avgCost }) to our rich structure
            const currentHoldings = get().holdings;
            const newHoldings: Holding[] = backendHoldings.map(bh => {
              const avgCost = bh.avgCost || bh.value;
              return {
                ticker: bh.name,
                name: bh.name, // The backend doesn't send the full name yet, maybe we should fix that too, but ticker is reliable
                shares: bh.volume,
                currentPrice: bh.value,
                avgCost,
                marketValue: bh.volume * bh.value,
                pnl: (bh.value - avgCost) * bh.volume,
                pnlPercent: avgCost > 0 ? ((bh.value - avgCost) / avgCost) * 100 : 0
              };
            });

            set({ cash, holdings: newHoldings });
          }
        } catch (error) {
          console.error('Failed to sync portfolio', error);
        }
      },

      executeTrade: async (ticker, name, shares, price, type) => {
        const token = useAuthStore.getState().user?.id;
        if (!token) return { success: false, message: 'Not authenticated' };

        const endpoint = '/game/portfolio/trades';
        
        try {
          const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ action: type, symbol: ticker, quantity: shares })
          });

          const data = await res.json();
          if (data.status === 'Success') {
            // Log local transaction
            const total = shares * price;
            const transaction: Transaction = {
              id: generateId(),
              type,
              ticker,
              name,
              shares,
              price,
              total: Math.round(total * 100) / 100,
              timestamp: Date.now(),
            };
            
            set(state => ({
              transactions: [transaction, ...state.transactions]
            }));

            // Re-sync with backend to get authoritative balance and holdings
            await get().syncWithBackend();

            // Refresh snapshot
            const finalState = get();
            const holdingsValue = finalState.holdings.reduce((s, h) => s + h.marketValue, 0);
            set(state => ({
              snapshots: [
                ...state.snapshots,
                { timestamp: Date.now(), totalValue: finalState.cash + holdingsValue },
              ],
            }));

            return { success: true, message: `${type === 'BUY' ? 'Bought' : 'Sold'} ${shares} shares of ${ticker}` };
          } else {
            return { success: false, message: data.message || 'Trade failed' };
          }
        } catch (error) {
          console.error('Trade error', error);
          return { success: false, message: 'Network error placing trade' };
        }
      },

      updateHoldingPrices: (prices) => {
        set((state) => ({
          holdings: state.holdings.map((h) => {
            const currentPrice = prices[h.ticker] ?? h.currentPrice;
            const marketValue = Math.round(h.shares * currentPrice * 100) / 100;
            const pnl = Math.round((currentPrice - h.avgCost) * h.shares * 100) / 100;
            const pnlPercent = Math.round(((currentPrice - h.avgCost) / h.avgCost) * 10000) / 100;
            return { ...h, currentPrice, marketValue, pnl, pnlPercent };
          }),
        }));
      },

      resetPortfolio: () => {
        set({
          cash: STARTING_CASH,
          holdings: [],
          transactions: [],
          snapshots: [{ timestamp: Date.now(), totalValue: STARTING_CASH }],
        });
      },

      getTotalValue: () => {
        const state = get();
        const holdingsValue = state.holdings.reduce((s, h) => s + h.marketValue, 0);
        return Math.round((state.cash + holdingsValue) * 100) / 100;
      },

      getTotalPnL: () => {
        const state = get();
        const totalValue = state.cash + state.holdings.reduce((s, h) => s + h.marketValue, 0);
        const dollar = Math.round((totalValue - STARTING_CASH) * 100) / 100;
        const percent = Math.round((dollar / STARTING_CASH) * 10000) / 100;
        return { dollar, percent };
      },
    }),
    {
      name: 'fec-vsm-portfolio',
    }
  )
);
