'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar/Navbar';
import { NewsTicker } from '@/components/ui/NewsTicker';
import { useAuthStore } from '@/store/authStore';
import { useMarketStore } from '@/store/marketStore';
import { usePortfolioStore } from '@/store/portfolioStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { stocks, initializeStocks, startSimulation, stopSimulation } = useMarketStore();
  const { updateHoldingPrices, syncWithBackend } = usePortfolioStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      syncWithBackend();
    }
  }, [isAuthenticated, router, syncWithBackend]);

  useEffect(() => {
    if (stocks.length === 0) {
      initializeStocks();
    }
    startSimulation();
    return () => stopSimulation();
  }, []);

  // Update portfolio holding prices whenever stocks change
  useEffect(() => {
    if (stocks.length > 0) {
      const prices: Record<string, number> = {};
      stocks.forEach((s) => {
        prices[s.ticker] = s.price;
      });
      updateHoldingPrices(prices);
    }
  }, [stocks, updateHoldingPrices]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />
      <NewsTicker />
      <main className="pt-[92px] max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
