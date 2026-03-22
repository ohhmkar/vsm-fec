"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar/Navbar";
import { NewsTicker } from "@/components/ui/NewsTicker";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { MarketManager } from "@/components/logic/MarketManager";

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
    // Only redirect if hydration is complete and user is not authenticated
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    } else if (hasHydrated && isAuthenticated) {
      syncWithBackend();
    }
  }, [isAuthenticated, hasHydrated, router, syncWithBackend]);

  // While waiting for hydration, show loading or nothing.
  // This prevents the flicker/redirect loop if store is just initializing.
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  // If redirecting, also return null to avoid rendering children briefly
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Logic components that don't render UI but manage state */}
      <MarketManager />

      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 pb-20">
        <NewsTicker />
        {children}
      </div>
    </div>
  );
}
