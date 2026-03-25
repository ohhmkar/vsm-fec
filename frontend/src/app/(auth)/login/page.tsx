'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { generateAllStocks } from '@/lib/stockEngine';

const tickerStocks = generateAllStocks();

function TickerTape() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const items = [...tickerStocks, ...tickerStocks, ...tickerStocks];

  return (
    <div className="absolute top-8 left-0 right-0 overflow-hidden opacity-60">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {items.map((stock, i) => (
          <div
            key={`${stock.ticker}-${i}`}
            className="flex items-center gap-2 text-sm font-mono"
          >
            <span className="text-[var(--text-primary)] font-semibold">
              {stock.ticker}
            </span>
            <span className="tabular-nums">${stock.price.toFixed(2)}</span>
            <span
              className={
                stock.changePercent >= 0
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--accent-red)]'
              }
            >
              {stock.changePercent >= 0 ? '+' : ''}
              {stock.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingChart() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04]"
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M0,400 C50,380 100,350 150,370 C200,390 250,320 300,280 C350,240 400,260 450,220 C500,180 550,200 600,160 C650,120 700,140 750,100 L800,80 L800,600 L0,600 Z"
        fill="url(#chartGradient)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 3, ease: 'easeOut' }}
      />
      <motion.path
        d="M0,400 C50,380 100,350 150,370 C200,390 250,320 300,280 C350,240 400,260 450,220 C500,180 550,200 600,160 C650,120 700,140 750,100 L800,80"
        fill="none"
        stroke="var(--accent-green)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Animated Background */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-[var(--bg-surface)] overflow-hidden items-center justify-center">
        <FloatingChart />
        <TickerTape />

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-12"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-4 font-[var(--font-display)]">
            Omkar&apos;s <span className="text-[var(--accent-green)]">VSM</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-md mx-auto">
            Experience the thrill of trading on a premium virtual stock market platform
          </p>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-[var(--text-dim)]">
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">15</div>
              <div>Live Stocks</div>
            </div>
            <div className="w-px h-10 bg-[var(--border-color)]" />
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">$100K</div>
              <div>Virtual Cash</div>
            </div>
            <div className="w-px h-10 bg-[var(--border-color)]" />
            <div>
              <div className="text-2xl font-bold text-[var(--accent-green)] tabular-nums">Live</div>
              <div>Market Sim</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom ticker */}
        <div className="absolute bottom-8 left-0 right-0 overflow-hidden opacity-40">
          <div className="flex gap-8 whitespace-nowrap animate-[scroll_20s_linear_infinite]">
            {tickerStocks.map((s) => (
              <span key={s.ticker} className="text-xs font-mono text-[var(--text-dim)]">
                {s.ticker}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 bg-[var(--bg-base)]">
        <LoginForm />
        <a
          href="/login/admin"
          className="mt-6 text-sm text-[var(--accent-red)] hover:underline flex items-center gap-2"
        >
          <Shield size={14} />
          Admin Login
        </a>
      </div>
    </div>
  );
}
