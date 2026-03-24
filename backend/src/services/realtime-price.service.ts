import { prisma } from './prisma.service';
import { roundTo2Places } from '../common/utils';
import {
  priceImpactMultiplier,
  totalSupplyPerStock,
} from '../common/game.config';
import { broadcastStockUpdate } from './socket.service';
import { logger } from './logging.service';

const MIN_PRICE = 0.01;
const MAX_PRICE_RETRIES = 10;

async function withPriceRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_PRICE_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorCode = error?.code || '';
      if ((errorCode === 'P2034' || errorCode === 'P1008') && attempt < MAX_PRICE_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Price update failed after retries');
}

export async function applyTradeImpact(
  symbol: string,
  quantity: number,
  tradeType: 'BUY' | 'SELL',
): Promise<number> {
  return withPriceRetry(async () => {
    const stock = await prisma.stock.findUnique({
      where: { symbol },
      select: { price: true },
    });

    if (!stock) {
      logger.warn(`[PRICE ENGINE] Stock ${symbol} not found, skipping price update`);
      return 0;
    }

    const currentPrice = stock.price;
    const impact = (quantity / totalSupplyPerStock) * priceImpactMultiplier;

    let newPrice: number;
    if (tradeType === 'BUY') {
      newPrice = currentPrice * (1 + impact);
    } else {
      newPrice = currentPrice * (1 - impact);
    }

    newPrice = Math.max(MIN_PRICE, roundTo2Places(newPrice));

    await prisma.stock.update({
      where: { symbol },
      data: { price: newPrice },
    });

    broadcastStockUpdate(symbol, newPrice, currentPrice, tradeType, quantity);
    return newPrice;
  });
}
