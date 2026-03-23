"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { MarketManager } from "@/components/logic/MarketManager";
import { IPOClaimModal } from "@/components/portfolio/IPOClaimModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const syncWithBackend = usePortfolioStore((s) => s.syncWithBackend);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    } else if (hasHydrated && isAuthenticated) {
      syncWithBackend();
    }
  }, [hasHydrated, isAuthenticated, router, syncWithBackend]);

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <MarketManager />
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20">
        {children}
      </div>
      <IPOClaimModal />
    </div>
  );
}
