'use client';

import { useEffect } from 'react';
import { useNewsStore } from '@/store/newsStore';
import { motion } from 'framer-motion';

export function NewsTicker() {
  const { news, fetchNews } = useNewsStore();

  useEffect(() => {
    fetchNews();
    // Poll for news every 30 seconds since news updates per round
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  if (news.length === 0) return null;

  const tickerText = news.join(' •   ');

  return (
    <div className="fixed top-[60px] left-0 right-0 h-8 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] overflow-hidden flex items-center z-30">
      <div className="absolute left-0 z-10 flex h-full items-center bg-[var(--bg-elevated)] px-3 border-r border-[var(--border-color)] shadow-[4px_0_8px_rgba(0,0,0,0.5)]">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-red)] uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[var(--accent-red)] rounded-full animate-pulse" />
          News
        </span>
      </div>
      
      <div className="relative flex-1 h-full flex items-center overflow-hidden pl-24">
        {/* We duplicate the text twice to create a seamless loop */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: tickerText.length * 0.15, // Speed depends on length
          }}
          className="whitespace-nowrap flex text-xs font-mono text-[var(--text-secondary)] tracking-wide"
        >
          <span className="pr-16">{tickerText}</span>
          <span className="pr-16">{tickerText}</span>
        </motion.div>
      </div>
    </div>
  );
}
