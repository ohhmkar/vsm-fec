import type { Server } from 'socket.io';
import { logger } from './logging.service';
import { getLeaderboard, getNews } from '../game/game.handlers';
import { getGameState } from '../game/game';

let io: Server | null = null;

export function setIO(server: Server) {
  io = server;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call setIO() first.');
  }
  return io;
}

/**
 * Broadcast a stock price update to all connected clients
 */
export function broadcastStockUpdate(
  symbol: string,
  newPrice: number,
  oldPrice: number,
  tradeType: 'BUY' | 'SELL',
  quantity: number,
) {
  if (!io) return;

  const payload = {
    symbol,
    price: newPrice,
    previousPrice: oldPrice,
    change: newPrice - oldPrice,
    changePercent: ((newPrice - oldPrice) / oldPrice) * 100,
    tradeType,
    quantity,
    timestamp: Date.now(),
  };

  io.emit('stock:price-update', payload);
  logger.info(
    `[REALTIME] ${symbol}: $${oldPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${tradeType} ${quantity} units, ${payload.changePercent > 0 ? '+' : ''}${payload.changePercent.toFixed(2)}%)`,
  );
}

/**
 * Broadcast a completed trade notification
 */
export function broadcastTrade(tradeData: {
  playerId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
}) {
  if (!io) return;

  io.emit('trade:executed', {
    ...tradeData,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast current leaderboard safely
 */
export async function broadcastLeaderboard() {
  if (!io) return;
  try {
    const leaderboard = await getLeaderboard();
    io.emit('leaderboard:update', leaderboard);
  } catch (err) {
    logger.error('Failed to broadcast leaderboard', err);
  }
}

/**
 * Broadcast the latest news for the current round
 */
export async function broadcastNews() {
  if (!io) return;
  try {
    const newsData = await getNews(getGameState());
    io.emit('news:update', newsData);
  } catch (err) {
    logger.error('Failed to broadcast news', err);
  }
}

/**
 * Broadcast custom admin notification to all players
 */
export function broadcastNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  if (!io) return;
  io.emit('admin:notification', {
    id: Date.now().toString(),
    message,
    type,
    timestamp: Date.now(),
  });
  logger.info(`[ADMIN NOTIFICATION] (${type.toUpperCase()}): ${message}`);
}
