import { prisma } from './prisma.service';
import { logger } from './index';

export class GameService {
  /**
   * Initialize or Reset the Game State
   */
  async initializeGame() {
    try {
      await prisma.gameState.upsert({
        where: { id: 'state' },
        update: { currentRound: 0, isRoundActive: false },
        create: { id: 'state', currentRound: 0, isRoundActive: false },
      });
      logger.info('Game state initialized.');
    } catch (error) {
      logger.error('Failed to initialize game state:', error);
      throw error;
    }
  }

  /**
   * Advance to next round or start specific round
   */
  async startRound() {
    const currentState = await prisma.gameState.findUnique({ where: { id: 'state' } });
    const nextRound = (currentState?.currentRound || 0) + 1;

    try {
      // Logic to update stocks could go here or be triggered by admin separately
      // For now, we update the state to allow trading
      await prisma.gameState.update({
        where: { id: 'state' },
        data: { currentRound: nextRound, isRoundActive: true },
      });
      logger.info(`Round ${nextRound} started. Trading is now ACTIVE.`);
      // Emit socket event here if needed
      return nextRound;
    } catch (error) {
      logger.error('Failed to start round:', error);
      throw error;
    }
  }

  /**
   * End the current round (disable trading)
   */
  async endRound() {
    try {
      await prisma.gameState.update({
        where: { id: 'state' },
        data: { isRoundActive: false },
      });
      logger.info('Round ended. Trading is now PAUSED.');
      return true;
    } catch (error) {
      logger.error('Failed to end round:', error);
      throw error;
    }
  }

  /**
   * Admin updates stock prices between rounds
   */
  async adminUpdateStock(symbol: string, newPrice: number, volatility?: number) {
    const currentState = await prisma.gameState.findUnique({ where: { id: 'state' } });
    if (currentState?.isRoundActive) {
      throw new Error('Cannot update stock while round is active. Please end the round first.');
    }

    try {
      const stock = await prisma.stock.update({
        where: { symbol },
        data: {
          price: newPrice,
          volatility: volatility ?? undefined,
        },
      });
      return stock;
    } catch (error) {
      logger.error(`Failed to update stock ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Check if trading is allowed
   */
  async isTradingAllowed() {
    const state = await prisma.gameState.findUnique({ where: { id: 'state' } });
    return state?.isRoundActive ?? false;
  }
}

export const gameService = new GameService();
