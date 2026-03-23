'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Stock } from '@/types';
import { generateAllStocks, simulatePriceTick } from '@/lib/stockEngine';
import { useAuthStore } from './authStore';
import { useNewsStore } from './newsStore';
import { useNotificationStore } from './notificationStore';

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
        tradeType: 'BUY' | 'SELL',
        quantity: number,
        timestamp: number
      }) => {
        set((state) => {
          const newStocks = state.stocks.map((stock) => {
            if (stock.ticker !== payload.symbol) return stock;

            const newPrice = payload.price;
            
            // Candle Aggregation Logic (1-minute candles)
            const tickTime = payload.timestamp;
            const alignedTime = Math.floor(tickTime / 60000) * 60000; // Align to minute start
            const alignedISO = new Date(alignedTime).toISOString();
            
            let newHistory = [...stock.history];
            const lastCandle = newHistory[newHistory.length - 1];
            
            if (lastCandle) {
              const lastTime = new Date(lastCandle.date).getTime();
              // Check if we are in the same minute as the last candle
              // Note: lastCandle.date comes from backend/seed which might be aligned or not.
              // We assume strict 1-minute buckets.
              const lastAligned = Math.floor(lastTime / 60000) * 60000;
              
              if (alignedTime === lastAligned) {
                // Update existing candle
                const updatedCandle = {
                  ...lastCandle,
                  high: Math.max(lastCandle.high, newPrice),
                  low: Math.min(lastCandle.low, newPrice),
                  close: newPrice,
                  volume: lastCandle.volume + payload.quantity
                };
                newHistory[newHistory.length - 1] = updatedCandle;
              } else {
                // Start a new candle
                newHistory.push({
                  date: alignedISO,
                  open: newPrice,
                  high: newPrice,
                  low: newPrice,
                  close: newPrice,
                  volume: payload.quantity
                });
              }
            } else {
              // Initialize history if empty
              newHistory.push({
                date: alignedISO,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
                volume: payload.quantity
              });
            }
            
            // Optional: Limit history length to prevent memory leaks (e.g. 2000 candles)
            if (newHistory.length > 2000) {
              newHistory = newHistory.slice(newHistory.length - 2000);
            }

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
