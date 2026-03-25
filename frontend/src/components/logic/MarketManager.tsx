"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/store/marketStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useAuthStore } from "@/store/authStore";

export function MarketManager() {
  const { stocks, initializeStocks } = useMarketStore();
  const updateHoldingPrices = usePortfolioStore((s) => s.updateHoldingPrices);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Simulation lifecycle
  useEffect(() => {
    if (!isAuthenticated) return;

    if (stocks.length === 0) {
      initializeStocks();
    }
  }, [isAuthenticated, stocks.length, initializeStocks]);

  // Price synchronization
  useEffect(() => {
    if (stocks.length > 0) {
      const prices: Record<string, number> = {};
      stocks.forEach((s) => {
        prices[s.ticker] = s.price;
      });
      updateHoldingPrices(prices);
    }
  }, [stocks, updateHoldingPrices]);

  return null;
}
