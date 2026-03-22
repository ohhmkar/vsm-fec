'use client';

import { create } from 'zustand';
import { useAuthStore } from './authStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface NewsStore {
  news: string[];
  fetchNews: () => Promise<void>;
}

export const useNewsStore = create<NewsStore>((set) => ({
  news: [],
  fetchNews: async () => {
    try {
      const token = useAuthStore.getState().user?.id;
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/game/info/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.status === 'Success' && Array.isArray(data.data)) {
        set({ news: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch news', error);
    }
  }
}));
