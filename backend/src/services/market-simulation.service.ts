import { prisma } from './prisma.service';
import { broadcastStockUpdate } from './socket.service';
import { logger } from './logging.service';

/**
 * Service to simulate market movement (random walk) during active rounds.
 * Replaces client-side simulation to ensure consistency across all clients.
 */
class MarketSimulationService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly TICK_RATE_MS = 2000; // Update every 2 seconds
  private readonly VOLATILITY_MULTIPLIER = 0.05; // Adjusts how wild the swings are

  /**
   * Start the market simulation loop
   */
  start() {
    if (this.intervalId) {
      logger.warn('[MARKET SIMULATOR] Already running');
      return;
    }
    
    logger.info('[MARKET SIMULATOR] Starting market simulation loop...');
    this.intervalId = setInterval(() => this.tick(), this.TICK_RATE_MS);
  }

  /**
   * Stop the market simulation loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[MARKET SIMULATOR] Stopped market simulation loop');
    }
  }

  private async tick() {
    try {
      // Fetch all active stocks
      const stocks = await prisma.stock.findMany();
      if (!stocks.length) return;

      // Randomly select a subset of stocks to update each tick (e.g., 30-50%)
      // to avoid overwhelming the socket with 15+ updates every 2s if not necessary
      // For now, let's update all of them for smoothness, or maybe just those that "moved"
      
      const updates = stocks.map(async (stock) => {
        // Calculate random walk based on stock's inherent volatility
        // Volatility in DB is typically the round's expected move, e.g. 5.0 (5%)
        // We want small micro-movements. 
        // Using a small random factor relative to the stock price.
        
        // Random drift: -0.2% to +0.2% per tick (adjust as needed)
        // Using stock.volatility as a scalar if it represents "riskiness"
        // But in this codebase, volatility seems to be "direction/magnitude for the round"
        // So we'll use a fixed base volatility + random noise.
        
        const changePercent = (Math.random() - 0.5) * 0.005; // +/- 0.25% max per tick
        const changeAmount = stock.price * changePercent;
        let newPrice = stock.price + changeAmount;
        
        // Ensure price checks (min 0.01)
        if (newPrice < 0.01) newPrice = 0.01;
        newPrice = Math.round(newPrice * 100) / 100;

        // Skip if effective price didn't change (e.g. < 1 cent change)
        if (newPrice === stock.price) return;

        // Update DB
        // We use updateMany or raw query for performance if needed, 
        // but individual updates are safer for concurrency with current Prisma usage
        await prisma.stock.update({
          where: { symbol: stock.symbol },
          data: { price: newPrice },
        });

        // Broadcast update
        broadcastStockUpdate(
          stock.symbol,
          newPrice,
          stock.price,
          'MARKET', // New type we allowed
          0 // No volume
        );
      });

      await Promise.all(updates);

    } catch (error) {
      logger.error('[MARKET SIMULATOR] Error in simulation tick:', error);
    }
  }
}

export const marketGameSimulator = new MarketSimulationService();
