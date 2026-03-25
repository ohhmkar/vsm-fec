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
  roundStartPrices: Record<string, number>;
  initializeStocks: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setRoundStartPrice: (ticker: string, price: number) => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  stocks: [],
  lastUpdated: Date.now(),
  isConnected: false,
  socket: null,
  roundStartPrices: {},

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
        // Capture round start prices when trading begins
        const state = get();
        const roundStartPrices: Record<string, number> = {};
        state.stocks.forEach((stock) => {
          roundStartPrices[stock.ticker] = stock.price;
        });
        set({ roundStartPrices });
        get().syncWithBackend();
      });
      newSocket.on('game:stage:CALCULATION_STAGE', () => {
        get().syncWithBackend();
      });

      newSocket.on('news:update', (items: (string | { content: string; sentiment?: string; type?: string; timestamp?: number })[]) => {
        // Handle incoming news update which can be string[] or object[]
        const processedItems = items.map((item, index) => {
             if (typeof item === 'string') {
                 return {
                     id: index,
                     content: item,
                     sentiment: 'NEUTRAL',
                     isAdminNews: false,
                     timestamp: Date.now()
                 };
             }
             return {
                 id: index,
                 content: item.content,
                 sentiment: item.sentiment || 'NEUTRAL',
                 isAdminNews: item.type === 'ADMIN',
                 timestamp: item.timestamp || Date.now()
             };
        });

        useNewsStore.setState({ 
            newsItems: processedItems,
            news: processedItems.map((i) => i.content)
        });
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
          // const roundStartPrices = state.roundStartPrices; // No longer needed for diff
          const newStocks = state.stocks.map((stock) => {
            if (stock.ticker !== payload.symbol) return stock;

            const newPrice = payload.price;
            // Calculate change relative to the authoritative round open price
            const basePrice = stock.open || stock.previousClose; // Use stored open price
            const change = newPrice - basePrice;
            const changePercent = basePrice === 0 ? 0 : (change / basePrice) * 100;
            
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
              change,
              changePercent,
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
        set({ stocks: baseStocks, lastUpdated: Date.now(), roundStartPrices: {} });
        
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
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.status === 'Success' && Array.isArray(data.data)) {
        const backendStocks: { id: string; value: number; openPrice: number }[] = data.data;
        const roundStartPrices = get().roundStartPrices;
        
        set((state) => {
          const newStocks = state.stocks.map((stock) => {
            const beData = backendStocks.find(b => b.id === stock.ticker);
            if (!beData) return stock;

            const newPrice = beData.value;
            // Use openPrice from backend as the specific round open price, fallback to current price if not set (0)
            const basePrice = beData.openPrice || newPrice;
            const change = newPrice - basePrice;
            const changePercent = basePrice === 0 ? 0 : (change / basePrice) * 100;

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
              open: basePrice, // Store the authoritative open price
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

  setRoundStartPrice: (ticker: string, price: number) => {
    set((state) => ({
      roundStartPrices: {
        ...state.roundStartPrices,
        [ticker]: price,
      },
    }));
  },
}));
