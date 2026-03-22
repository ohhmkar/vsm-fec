'use client';

import { create } from 'zustand';

export interface AdminNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface NotificationStore {
  notifications: AdminNotification[];
  currentNotification: AdminNotification | null;
  addNotification: (notification: AdminNotification) => void;
  dismissNotification: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  currentNotification: null,

  addNotification: (notification) => {
    set({ currentNotification: notification });
    setTimeout(() => {
      set((state) => ({
        notifications: [...state.notifications, notification],
        currentNotification: null,
      }));
    }, 5000);
  },

  dismissNotification: () => {
    set({ currentNotification: null });
  },
}));
