'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { useNewsStore } from '@/store/newsStore';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { itemVariants, listVariants } from '@/components/ui/PageWrapper';

interface NewsItem {
  id: number;
  content: string;
  sentiment: string;
  isAdminNews: boolean;
  timestamp?: number;
}

export default function NewsPage() {
  const { news, fetchNews } = useNewsStore();
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (news.length > 0) {
      const formattedNews: NewsItem[] = news.map((content, index) => ({
        id: index,
        content,
        sentiment: 'NEUTRAL',
        isAdminNews: false,
      }));
      setAllNews(prev => {
        const combined = [...formattedNews, ...prev.filter(n => !prev.find(p => p.content === n.content))];
        return combined;
      });
      setLoading(false);
    }
  }, [news]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return <TrendingUp size={16} className="text-[var(--accent-green)]" />;
      case 'BEARISH':
        return <TrendingDown size={16} className="text-[var(--accent-red)]" />;
      default:
        return <Minus size={16} className="text-[var(--text-dim)]" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20';
      case 'BEARISH':
        return 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20';
      default:
        return 'bg-[var(--bg-elevated)] border-[var(--border-color)]';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper size={24} className="text-[var(--accent-purple)]" />
            Market News
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Latest updates and breaking news from the market
          </p>
        </div>

        {allNews.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-8 text-center">
            <Newspaper size={48} className="mx-auto mb-4 text-[var(--text-dim)] opacity-50" />
            <p className="text-[var(--text-dim)]">No news available yet. News will appear when the round starts.</p>
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {allNews.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                variants={itemVariants}
                className={`p-4 rounded-xl border ${getSentimentColor(item.sentiment)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] leading-relaxed">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {item.isAdminNews && (
                        <span className="text-xs px-2 py-0.5 bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] rounded">
                          ADMIN
                        </span>
                      )}
                      <span className={`text-xs font-medium ${
                        item.sentiment === 'BULLISH' ? 'text-[var(--accent-green)]' :
                        item.sentiment === 'BEARISH' ? 'text-[var(--accent-red)]' :
                        'text-[var(--text-dim)]'
                      }`}>
                        {item.sentiment}
                      </span>
                      {item.timestamp && (
                        <span className="text-xs text-[var(--text-dim)] flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.timestamp).toLocaleTimeString()}
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