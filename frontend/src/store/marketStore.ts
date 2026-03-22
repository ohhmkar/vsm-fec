'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Stock } from '@/types';
import { generateAllStocks, simulatePriceTick } from '@/lib/stockEngine';
import { useAuthStore } from './authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

interface MarketStore {
  stocks: Stock[];
  lastUpdated: number;
  isSimulating: boolean;
  isConnected: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  socket: Socket | null;
  initializeStocks: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  startSimulation: () => void;
  stopSimulation: () => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  stocks: [],
  lastUpdated: Date.now(),
  isSimulating: false,
  isConnected: false,
  intervalId: null,
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
      const newSocket = io(BACKEND_URL, {
        auth: {
          token: useAuthStore.getState().user?.id // JWT
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

  startSimulation: () => {
    if (get().isSimulating) return;
    if (get().stocks.length === 0) {
      get().initializeStocks();
    }
    // Eye-candy ticks
    const intervalId = setInterval(() => {
      set((state) => ({
        stocks: state.stocks.map((stock) => simulatePriceTick(stock)),
        lastUpdated: Date.now(),
      }));
    }, 3000 + Math.random() * 2000);
    set({ isSimulating: true, intervalId });
  },

  stopSimulation: () => {
    const { intervalId, socket } = get();
    if (intervalId) clearInterval(intervalId);
    if (socket) {
      socket.disconnect();
    }
    set({ isSimulating: false, isConnected: false, intervalId: null, socket: null });
  },
}));
