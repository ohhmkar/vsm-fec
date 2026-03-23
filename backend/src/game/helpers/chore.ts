import { prisma } from '../../services/prisma.service';

export async function uploadNews(
  newsData: {
    content: string;
    forInsider: boolean;
    roundApplicable: number;
  }[],
) {
  await prisma.news.createMany({
    data: newsData,
  });
}

export async function uploadStock(
  stockData: {
    symbol: string;
    volatility: number;
    price: number;
    roundIntorduced: number;
  }[],
) {
  const data = stockData.map((s) => ({
    symbol: s.symbol,
    volatility: s.volatility,
    price: s.price,
    roundIntroduced: s.roundIntorduced,
  }));
  await prisma.stock.createMany({
    data,
  });
}

export async function uploadStockUpdate(
  stockData: {
    symbol: string;
    volatility: number;
    forRound: number;
  }[],
) {
  await prisma.stockGameData.createMany({
    data: stockData,
  });
}

import { initialBankBalance } from '../../common/game.config';

export async function resetGameData() {
  await prisma.$transaction([
    // Delete all transactions
    prisma.transaction.deleteMany(),

    // Reset stock prices to base 100.0 (and clear history/volatility if needed)
    prisma.stock.updateMany({
      data: {
        price: 100.0,
      }
    }),

    // Clear stock price history (StockGameData)
    prisma.stockGameData.deleteMany(),

    // Reset player portfolios
    prisma.playerPortfolio.updateMany({
      data: {
        bankBalance: initialBankBalance,
        totalPortfolioValue: 0,
        stocks: []
      }
    }),
    
    // Reset game state
    prisma.gameState.update({
        where: { id: 'state' },
        data: { currentRound: 0, isRoundActive: false }
    }),

    // Reset round configs except maybe Round 1 default? Or delete all future configs?
    // User asked to reset prices and transactions, likely preserving schedule.
    // prisma.roundConfig.deleteMany(), // Optional: decide if configs should be cleared. Users might want to keep schedule.
  ]);
}

export async function flushDatabase() {
  await prisma.news.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.playerAccount.deleteMany();
}

export async function flushPlayerTable() {
  await prisma.playerAccount.deleteMany();
}

export async function flushUserTable() {
  await prisma.user.deleteMany();
}
