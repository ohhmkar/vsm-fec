'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useNewsStore } from '@/store/newsStore';

export function NewsTicker() {
  const { news, fetchNews } = useNewsStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [news.length]);

  if (news.length === 0) return null;

  const currentNews = news[currentIndex];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return <TrendingUp size={14} className="text-[var(--accent-green)]" />;
      case 'BEARISH':
        return <TrendingDown size={14} className="text-[var(--accent-red)]" />;
      default:
        return <Minus size={14} className="text-[var(--text-dim)]" />;
    }
  };

  return (
    <div className="fixed top-[60px] left-0 right-0 h-10 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] overflow-hidden flex items-center z-30">
      <div className="absolute left-0 z-10 flex h-full items-center bg-[var(--accent-red)] px-4 shadow-[4px_0_8px_rgba(0,0,0,0.3)]">
        <span className="text-[10px] font-bold tracking-widest text-white uppercase flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Breaking
        </span>
      </div>
      
      <div className="flex-1 flex items-center justify-center overflow-hidden pl-28 pr-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            {getSentimentIcon('NEUTRAL')}
            <span className="font-medium">{currentNews}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 pr-4">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-[var(--accent-blue)] w-3'
                : 'bg-[var(--border-color)] hover:bg-[var(--text-dim)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
