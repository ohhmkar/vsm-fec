"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hexagon,
  Radar,
  LineChart,
  WalletCards,
  ScanFace,
  Timer,
  LogOut,
  Menu,
  X,
  ChevronDown,
  DollarSign,
  Crown,
  Rocket,
  Command,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useMarketStore } from "@/store/marketStore";
import { formatCurrency } from "@/lib/utils";
import { Logo3D } from "@/components/ui/Logo3D";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Radar },
  { href: "/stocks", label: "Stocks", icon: LineChart },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/leaderboard", label: "Ranks", icon: Crown },
  { href: "/powerups", label: "Power-Ups", icon: Rocket },
];

function MarketClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-sm font-mono tabular-nums text-[var(--text-secondary)]">
      <Timer size={14} />
      <span>{time}</span>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const cash = usePortfolioStore((s) => s.cash);
  const isConnected = useMarketStore((s) => s.isConnected);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "DT";

  return (
    <nav className="fixed top-0 left-0 right-0 h-[64px] backdrop-blur-md bg-[var(--glass-surface)] border-b border-[var(--glass-border)] z-40 transition-all duration-300">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/home"
          className="hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <div className="w-10 h-10 relative">
            <Logo3D className="w-full h-full" />
          </div>
          <span className="font-display font-medium text-lg tracking-tight">
            FEC-VSM
          </span>
        </Link>

        {/* Center: Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-1 relative">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
              >
                <span
                  className={
                    isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-blue)] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Profile link always present */}
          <Link
            href="/profile"
            className="relative px-4 py-2 text-sm font-medium transition-colors"
          >
            <span
              className={
                pathname.startsWith("/profile")
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }
            >
              Profile
            </span>
            {pathname.startsWith("/profile") && (
              <motion.div
                layoutId="nav-underline"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-blue)] rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* Admin link conditionally present */}
          {user?.email.includes("admin") && (
            <Link
              href="/admin-dashboard"
              className="relative px-4 py-2 text-sm font-bold transition-colors text-[var(--accent-red)] flex items-center gap-1.5 ml-2"
            >
              <Command size={14} />
              Admin
              {pathname.startsWith("/admin-dashboard") && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-red)] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )}
        </div>

        {/* Right: Clock + Connection + User */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-elevated)] text-xs font-medium border border-[var(--border-color)]">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-[var(--accent-green)]" : "bg-[var(--accent-red)]"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-[var(--accent-green)]" : "bg-[var(--accent-red)]"}`}
                ></span>
              </span>
              <span className="text-[var(--text-secondary)]">
                {isConnected ? "LIVE" : "WAIT"}
              </span>
            </div>
            <MarketClock />
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-green)] flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--text-dim)] transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-color)]">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">
                      {user?.email}
                    </p>
                  </div>
                  <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
                    <DollarSign
                      size={14}
                      className="text-[var(--accent-green)]"
                    />
                    <span className="text-sm font-mono tabular-nums">
                      {formatCurrency(cash)}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm text-[var(--accent-red)] hover:bg-[var(--bg-surface)] transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border-color)] overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/profile"
                    ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <ScanFace size={18} />
                Profile
              </Link>

              {user?.email.includes("admin") && (
                <Link
                  href="/admin-dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    pathname === "/admin-dashboard"
                      ? "bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                      : "text-[var(--accent-red)]/80 hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Command size={18} />
                  Admin
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
