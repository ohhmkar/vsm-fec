"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from "lucide-react";
import { useNewsStore } from "@/store/newsStore";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { itemVariants, listVariants } from "@/components/ui/PageWrapper";

interface NewsItem {
  id: number;
  content: string;
  sentiment: string;
  isAdminNews: boolean;
  timestamp?: number;
}

export default function NewsPage() {
  const { newsItems, fetchNews } = useNewsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      await fetchNews();
      setLoading(false);
    };
    loadNews();

    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return <TrendingUp size={24} className="text-[var(--accent-green)]" />;
      case "BEARISH":
        return <TrendingDown size={24} className="text-[var(--accent-red)]" />;
      default:
        return <Minus size={24} className="text-[var(--text-dim)]" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return "bg-[var(--accent-green)]/5 border-[var(--accent-green)]/30 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.3)] hover:border-[var(--accent-green)]/50";
      case "BEARISH":
        return "bg-[var(--accent-red)]/5 border-[var(--accent-red)]/30 shadow-[0_4px_20px_-10px_rgba(239,68,68,0.3)] hover:border-[var(--accent-red)]/50";
      default:
        return "bg-[var(--bg-elevated)] border-[var(--border-color)] hover:border-[var(--text-dim)]/50";
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 border-2 border-[var(--border-color)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Newspaper size={32} className="text-[var(--accent-purple)]" />
              Market News Feed
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Real-time updates, sentiment analysis, and market-moving events.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-dim)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            LIVE FEED
          </div>
        </div>

        {newsItems.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-12 text-center animate-pulse">
            <Newspaper
              size={48}
              className="mx-auto mb-4 text-[var(--text-dim)] opacity-50"
            />
            <p className="text-[var(--text-dim)] font-medium">
              Waiting for market news...
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-2">
              News will appear shortly after the round begins.
            </p>
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {newsItems.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                variants={itemVariants}
                className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-300 ${getSentimentColor(item.sentiment)}`}
              >
                {/* Background decorative element */}
                <div
                  className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.08] blur-2xl ${item.sentiment === "BULLISH" ? "bg-[var(--accent-green)]" : item.sentiment === "BEARISH" ? "bg-[var(--accent-red)]" : "bg-gray-500"}`}
                />

                <div className="flex items-start gap-5 relative z-10">
                  <div
                    className={`p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm shrink-0 flex items-center justify-center`}
                  >
                    {getSentimentIcon(item.sentiment)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3
                        className={`font-bold text-lg leading-tight uppercase tracking-wide ${item.sentiment === "BULLISH" ? "text-[var(--accent-green)]" : item.sentiment === "BEARISH" ? "text-[var(--accent-red)]" : "text-[var(--text-primary)]"}`}
                      >
                        {item.sentiment === "NEUTRAL"
                          ? "Market Update"
                          : `${item.sentiment} ALERT`}
                      </h3>
                      {item.timestamp && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] font-mono bg-[var(--bg-surface)] px-2 py-1 rounded-md border border-[var(--border-color)]/50">
                          <Clock size={12} />
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <p className="text-[var(--text-primary)] font-medium text-base leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {item.isAdminNews ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30">
                          📢 Admin Announcement
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-dim)] border border-[var(--border-color)] shadow-sm">
                          🤖 Algorithmic
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
