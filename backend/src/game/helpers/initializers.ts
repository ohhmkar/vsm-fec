import { prisma } from '../../services/prisma.service';
import { initialBankBalance } from '../../common/game.config';

export async function initializePlayer(userId: string) {
  const existing = await prisma.playerAccount.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing.id;
  }

  return await prisma.$transaction(async (tx) => {
    const allStocks = await tx.stock.findMany({ select: { symbol: true } });
    const stockPortfolioData = allStocks.map((s) => ({
      symbol: s.symbol,
      volume: 0,
      avgCost: 0,
    }));

    const player = await tx.playerAccount.create({
      data: {
        userId,
        isBanned: false,
        portfolio: {
          create: {
            bankBalance: initialBankBalance,
            totalPortfolioValue: 0,
            stocks: stockPortfolioData,
          },
        },
        powerups: {
          create: {
            insiderTradingStatus: 'Unused',
            muftKaPaisaStatus: 'Unused',
            stockBettingStatus: 'Unused',
          },
        },
      },
      select: { id: true },
    });

    return player.id;
  });
}
