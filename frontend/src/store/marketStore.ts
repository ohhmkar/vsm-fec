'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Stock } from '@/types';
import { generateAllStocks } from '@/lib/stockEngine';
import { useAuthStore } from './authStore';
import { useNewsStore } from './newsStore';
import { useNotificationStore } from './notificationStore';
import { usePortfolioStore } from './portfolioStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

interface MarketStore {
  stocks: Stock[];
  lastUpdated: number;
  isConnected: boolean;
  socket: Socket | null;
  initializeStocks: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  stocks: [],
  lastUpdated: Date.now(),
  isConnected: false,
  socket: null,

  initializeStocks: async () => {
    // Generate base deterministic data for charts
    const baseStocks = generateAllStocks();
    set({ stocks: baseStocks, lastUpdated: Date.now() });
    
    // Sync true values from backend
    await get().syncWithBackend();

    // Setup Socket Connect
    const socket = get().socket;
    if (!socket) {
      const token = useAuthStore.getState().user?.id; // JWT
      const newSocket = io(BACKEND_URL, {
        extraHeaders: {
          authorization: token ? `Bearer ${token}` : ''
        }
      });

      newSocket.on('connect', () => set({ isConnected: true }));
      newSocket.on('disconnect', () => set({ isConnected: false }));

      newSocket.on('game:stage:TRADING_STAGE', () => {
        get().syncWithBackend();
      });
      newSocket.on('game:stage:CALCULATION_STAGE', () => {
        get().syncWithBackend();
      });

      newSocket.on('news:update', (news: string[]) => {
        useNewsStore.setState({ news });
      });

      newSocket.on('news:item', (item: { id: number; content: string; sentiment: string; isAdminNews: boolean }) => {
        useNewsStore.getState().addNewsItem({
          ...item,
          timestamp: Date.now(),
        });
      });

      newSocket.on('admin:notification', (notification: {
        id: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        timestamp: number;
      }) => {
        useNotificationStore.getState().addNotification(notification);
      });

      newSocket.on('stock:price-update', (payload: {
        symbol: string,
        price: number,
        previousPrice: number,
        change: number,
        changePercent: number,
        tradeType: 'BUY' | 'SELL' | 'MARKET',
        quantity: number,
        timestamp: number
      }) => {
        set((state) => {
          const newStocks = state.stocks.map((stock) => {
            if (stock.ticker !== payload.symbol) return stock;

            const newPrice = payload.price;
            
            // Append incoming tick to history
            const newHistory = [...stock.history, {
              date: new Date(payload.timestamp).toISOString(),
              open: newPrice,
              high: newPrice,
              low: newPrice,
              close: newPrice,
              volume: payload.quantity
            }];

            return {
              ...stock,
              price: newPrice,
              change: payload.change,
              changePercent: payload.changePercent,
              history: newHistory,
              dayHigh: Math.max(stock.dayHigh, newPrice),
              dayLow: Math.min(stock.dayLow, newPrice),
            };
          });

          return { stocks: newStocks, lastUpdated: Date.now() };
        });
      });

      newSocket.on('game:reset', () => {
        // Reset everything to initial state
        const baseStocks = generateAllStocks();
        set({ stocks: baseStocks, lastUpdated: Date.now() });
        
        // Reset User Portfolio locally
        usePortfolioStore.getState().resetPortfolio();

        // Force a sync to align with backend (which should now be at base price 100)
        get().syncWithBackend();
      });


      set({ socket: newSocket });
    }
  },

  syncWithBackend: async () => {
    try {
      const token = useAuthStore.getState().user?.id;
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/game/info/stocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.status === 'Success' && Array.isArray(data.data)) {
        const backendStocks: { id: string; value: number }[] = data.data;
        
        set((state) => {
          const newStocks = state.stocks.map((stock) => {
            const beData = backendStocks.find(b => b.id === stock.ticker);
            if (!beData) return stock;

            const newPrice = beData.value;
            const change = newPrice - stock.previousClose;
            const changePercent = (change / stock.previousClose) * 100;

            // Append tick to history
            const newHistory = [...stock.history, {
              date: new Date().toISOString(),
              open: newPrice,
              high: newPrice,
              low: newPrice,
              close: newPrice,
              volume: Math.round(stock.avgVolume / 390)
            }];

            return {
              ...stock,
              price: newPrice,
              change,
              changePercent,
              history: newHistory,
              dayHigh: Math.max(stock.dayHigh, newPrice),
              dayLow: Math.min(stock.dayLow, newPrice),
            };
          });

          return { stocks: newStocks, lastUpdated: Date.now() };
        });
      }
    } catch (error) {
      console.error('Failed to sync stocks', error);
    }
  },
}));
