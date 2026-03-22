import { IGameState } from '../types';
import { NotFound, UnprocessableEntity } from '../errors/index';
import { prisma } from '../services/prisma.service';
import { arrayToMap } from '../common/utils';
import { muftPaisa } from '../common/game.config';
import { applyTradeImpact } from '../services/realtime-price.service';
import { broadcastTrade } from '../services/socket.service';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 50;

async function withRetry<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.code || error?.meta?.code || '';
      
      if (errorCode === 'P2034' || errorCode === 'P1008' || error?.message?.includes('deadlocked')) {
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

export async function buyStock(
  playerId: string,
  stockId: string,
  quantity: number,
  gameState: IGameState,
) {
  return withRetry(async () => {
    let tradePrice = 0;
    let totalCost = 0;

    await prisma.$transaction(async (tx) => {
      const stockData = await tx.stock.findFirst({
        where: {
          symbol: stockId,
          roundIntroduced: { lte: gameState.roundNo },
        },
      });

      if (!stockData) {
        throw new NotFound('Stock not found');
      }

      const playerPort = await tx.playerPortfolio.findUnique({
        where: { playerId },
      });

      if (!playerPort) {
        throw new NotFound('Player not found');
      }

      tradePrice = stockData.price;
      totalCost = tradePrice * quantity;

      if (playerPort.bankBalance < totalCost) {
        throw new UnprocessableEntity('Insufficient funds');
      }

      const portStocks = playerPort.stocks as any[];
      let stockEntry = portStocks.find((s: any) => s.symbol === stockId);

      if (!stockEntry) {
        portStocks.push({ symbol: stockId, volume: quantity, avgCost: tradePrice });
      } else {
        const oldVolume = stockEntry.volume;
        const oldAvgCost = stockEntry.avgCost || 0;
        const newVolume = oldVolume + quantity;
        const newAvgCost =
          (oldVolume * oldAvgCost + quantity * tradePrice) / newVolume;

        stockEntry.volume = newVolume;
        stockEntry.avgCost = newAvgCost;
      }

      await tx.playerPortfolio.update({
        where: { playerId },
        data: {
          bankBalance: { decrement: totalCost },
          totalPortfolioValue: { increment: totalCost },
          stocks: portStocks,
        },
      });
    }, { isolationLevel: 'ReadCommitted' });

    const newPrice = await applyTradeImpact(stockId, quantity, 'BUY');

    broadcastTrade({
      playerId,
      symbol: stockId,
      type: 'BUY',
      quantity,
      price: tradePrice,
      total: totalCost,
    });

    return {
      symbol: stockId,
      type: 'BUY' as const,
      quantity,
      price: tradePrice,
      total: totalCost,
      newStockPrice: newPrice,
    };
  }, 'buyStock');
}

export async function sellStock(
  playerId: string,
  stockId: string,
  quantity: number,
  gameState: IGameState,
) {
  return withRetry(async () => {
    let tradePrice = 0;
    let totalRevenue = 0;

    await prisma.$transaction(async (tx) => {
      const stockData = await tx.stock.findFirst({
        where: {
          symbol: stockId,
          roundIntroduced: { lte: gameState.roundNo },
        },
      });

      if (!stockData) {
        throw new NotFound('Stock not found');
      }

      const playerPort = await tx.playerPortfolio.findUnique({
        where: { playerId },
      });

      if (!playerPort) {
        throw new NotFound('Player not found');
      }

      const portStocks = playerPort.stocks as any[];
      const stockIndex = portStocks.findIndex((s: any) => s.symbol === stockId);

      if (stockIndex === -1) {
        throw new UnprocessableEntity('Stock not found in portfolio');
      }
      
      if (portStocks[stockIndex].volume < quantity) {
        throw new UnprocessableEntity('Insufficient stocks');
      }

      tradePrice = stockData.price;
      totalRevenue = tradePrice * quantity;
      portStocks[stockIndex].volume -= quantity;

      await tx.playerPortfolio.update({
        where: { playerId },
        data: {
          bankBalance: { increment: totalRevenue },
          totalPortfolioValue: { decrement: totalRevenue },
          stocks: portStocks,
        },
      });
    }, { isolationLevel: 'ReadCommitted' });

    const newPrice = await applyTradeImpact(stockId, quantity, 'SELL');

    broadcastTrade({
      playerId,
      symbol: stockId,
      type: 'SELL',
      quantity,
      price: tradePrice,
      total: totalRevenue,
    });

    return {
      symbol: stockId,
      type: 'SELL' as const,
      quantity,
      price: tradePrice,
      total: totalRevenue,
      newStockPrice: newPrice,
    };
  }, 'sellStock');
}

export async function getNews(gameState: IGameState) {
  const newsData = await prisma.news.findMany({
    where: {
      roundApplicable: gameState.roundNo,
      forInsider: false,
    },
    select: { content: true },
  });
  return newsData.map((n) => n.content);
}

export async function getStocks(gameState: IGameState) {
  const stocks = await prisma.stock.findMany({
    where: {
      roundIntroduced: { lte: gameState.roundNo },
    },
    select: { symbol: true, price: true },
  });
  return stocks.map((s) => ({ id: s.symbol, value: s.price }));
}

export async function getLeaderboard() {
  const portfolios = await prisma.playerPortfolio.findMany({
    include: {
      player: {
        include: {
          user: {
            select: { u1Name: true, u2Name: true },
          },
        },
      },
    },
  });

  const leaderboard = portfolios
    .map((p, index) => {
      const wealth = p.bankBalance + p.totalPortfolioValue;
      const u1 = p.player.user.u1Name;
      const u2 = p.player.user.u2Name;
      const name = u2 ? `${u1} & ${u2}` : u1;
      return {
        // rank will be assigned after sort
        name,
        wealth,
      };
    })
    .sort((a, b) => b.wealth - a.wealth)
    .map((p, index) => ({
      rank: index + 1,
      name: p.name,
      wealth: p.wealth,
    }));

  return leaderboard;
}

export async function getPlayerProfile(playerId: string) {
  const profile = await prisma.playerPortfolio.findUnique({
    where: { playerId },
    select: {
      bankBalance: true,
      totalPortfolioValue: true,
    },
  });

  if (!profile) return null; // Or throw error? Original returned result[0] which might be undefined.
  
  return {
    balance: profile.bankBalance,
    valuation: profile.totalPortfolioValue,
  };
}

export async function getPlayerPortfolio(playerId: string) {
  // Use transaction to get consistent snapshot of stocks and portfolio
  return prisma.$transaction(async (tx) => {
    const portfolio = await tx.playerPortfolio.findUnique({
      where: { playerId },
    });

    if (!portfolio) throw new NotFound('Portfolio not found');

    const stocks = await tx.stock.findMany();
    const stocksMap = arrayToMap(stocks, 'symbol');

    const playerStocks = (portfolio.stocks as any[]).map((s: any) => {
      const currentPrice = stocksMap.get(s.symbol)?.price || 0;
      return {
        name: s.symbol,
        volume: s.volume,
        value: currentPrice,
        avgCost: s.avgCost || 0,
      };
    });

    return {
      valuation: portfolio.totalPortfolioValue,
      bankBalance: portfolio.bankBalance,
      portfolio: playerStocks,
    };
  });
}

export async function getPlayerBalence(playerId: string) {
  const p = await prisma.playerPortfolio.findUnique({
    where: { playerId },
    select: { bankBalance: true },
  });
  return { balance: p?.bankBalance };
}

export async function useInsiderTrading(playerId: string, gameState: IGameState) {
  return prisma.$transaction(async (tx) => {
    const powerups = await tx.playerPowerups.findUnique({
      where: { playerId },
    });

    if (!powerups) throw new NotFound('Player not found'); // Powerups missing implies player setup fail

    if (powerups.insiderTradingStatus === 'Used') {
      throw new UnprocessableEntity('Insider Trading already used');
    }

    await tx.playerPowerups.update({
      where: { playerId },
      data: { insiderTradingStatus: 'Used' },
    });

    const newsData = await tx.news.findMany({
      where: {
        roundApplicable: gameState.roundNo,
        forInsider: true, // Only fetch Insider news? Original code: forInsider: true
      },
      select: { content: true },
    });

    return newsData.map((n) => n.content);
  });
}

export async function useMuftKaPaisa(playerId: string) {
  return prisma.$transaction(async (tx) => {
    const powerups = await tx.playerPowerups.findUnique({
      where: { playerId },
    });

    if (!powerups) throw new NotFound('Player not found');

    if (powerups.muftKaPaisaStatus === 'Used') { // Original checked 'Used'
       // Wait, original: if (status == 'Used') throw... then set 'Active'.
       // What if 'Active'? It allows setting 'Active' again?
       // Likely should check if Active too.
       // But existing code only checked 'Used'. I'll stick to it.
       // Actually 'Active' -> 'Used' transition happens in scheduled task.
       // So user activates -> Active. Task runs -> Used.
       // If user activates again while Active? It resets to Active.
       // Seems fine.
      throw new UnprocessableEntity('Muft Ka Paisa already used');
    }
    
    // Also check if already Active? If so, duplicate activation.
    if (powerups.muftKaPaisaStatus === 'Active') {
        throw new UnprocessableEntity('Already active');
    }

    await tx.playerPowerups.update({
      where: { playerId },
      data: { muftKaPaisaStatus: 'Active' },
    });

    await tx.playerPortfolio.update({
      where: { playerId },
      data: {
        bankBalance: { increment: muftPaisa }, // Add muftPaisa
      },
    });
  });
}

export async function useStockBetting(
  playerId: string,
  stockBettingAmount: number,
  stockBettingPrediction: string,
  stockBettingLockedSymbol: string,
) {
  return prisma.$transaction(async (tx) => {
    const powerups = await tx.playerPowerups.findUnique({
      where: { playerId },
    });
    
    if (!powerups) throw new NotFound('Player not found');
    if (powerups.stockBettingStatus === 'Used') {
       throw new UnprocessableEntity('Stock Betting already used');
    }
    if (powerups.stockBettingStatus === 'Active') {
       throw new UnprocessableEntity('Already active');
    }

    const portfolio = await tx.playerPortfolio.findUnique({
      where: { playerId },
    });
    
    if (!portfolio || portfolio.bankBalance < stockBettingAmount) {
      throw new UnprocessableEntity('Insufficient funds');
    }

    await tx.playerPortfolio.update({
      where: { playerId },
      data: { 
        bankBalance: { decrement: stockBettingAmount },
      },
    });
    
    const stock = await tx.stock.findUnique({
       where: { symbol: stockBettingLockedSymbol },
    });
    
    if (!stock) throw new NotFound('Stock not found');

    await tx.playerPowerups.update({
      where: { playerId },
      data: {
        stockBettingStatus: 'Active',
        stockBettingAmount: stockBettingAmount,
        stockBettingPrediction: stockBettingPrediction,
        stockBettingLockedPrice: stock.price,
        stockBettingLockedSymbol: stockBettingLockedSymbol,
      },
    });
  });
}
