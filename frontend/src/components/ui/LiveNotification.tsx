'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

const typeConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-[var(--accent-blue)]',
    iconColor: 'text-white',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-[var(--accent-green)]',
    iconColor: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-[var(--accent-yellow)]',
    iconColor: 'text-black',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-[var(--accent-red)]',
    iconColor: 'text-white',
  },
};

export function LiveNotification() {
  const currentNotification = useNotificationStore((s) => s.currentNotification);
  const dismissNotification = useNotificationStore((s) => s.dismissNotification);

  const config = currentNotification ? typeConfig[currentNotification.type] : typeConfig.info;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 z-[9999] max-w-lg w-full px-4"
        >
          <div
            className={`${config.bgColor} rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3`}
          >
            <Icon size={20} className={config.iconColor} />
            <p className="flex-1 text-sm font-medium text-white">
              {currentNotification.message}
            </p>
            <button
              onClick={dismissNotification}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
