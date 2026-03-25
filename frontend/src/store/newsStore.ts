'use client';

import { create } from 'zustand';
import { useAuthStore } from './authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface NewsItem {
  id: number;
  content: string;
  sentiment: string;
  isAdminNews: boolean;
  timestamp?: number;
}

interface NewsStore {
  news: string[];
  newsItems: NewsItem[];
  fetchNews: () => Promise<void>;
  addNewsItem: (item: NewsItem) => void;
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  news: [],
  newsItems: [],
  fetchNews: async () => {
    try {
      const token = useAuthStore.getState().user?.id;
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/game/info/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.status === 'Success' && Array.isArray(data.data)) {
        // Backend now returns objects with content, sentiment, type, timestamp
        // If it's string (old format fallback), handle it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = data.data.map((item: string | Record<string, any>, index: number) => {
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
        
        set({ 
            newsItems: items, 
            news: items.map((i: NewsItem) => i.content) 
        });
      }
    } catch (error) {
      console.error('Failed to fetch news', error);
    }
  },
  addNewsItem: (item: NewsItem) => {
    set(state => ({
      newsItems: [item, ...state.newsItems].slice(0, 50),
      news: [item.content, ...state.news],
    }));
  },
}));
