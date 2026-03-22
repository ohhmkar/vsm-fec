import { db } from '../../services/database.service';
import { eq } from 'drizzle-orm';
import {
  playerPortfolio,
  playerAccount,
  stocks,
  playerPowerups,
} from '../../models/index';
import { initialBankBalance } from '../../common/game.config';

export function initializePlayer(userId: string) {
  return db.transaction(async (trx) => {
    const stockData: { symbol: string; volume: number }[] = [];

    (await trx.select({ symbol: stocks.symbol }).from(stocks)).forEach(
      (stock) => {
        stockData.push({ symbol: stock.symbol, volume: 0 });
      },
    );

    const existing = await trx.select({ playerId: playerAccount.id }).from(playerAccount).where(eq(playerAccount.userId, userId));
    if (existing.length > 0) {
      return existing[0].playerId;
    }

    const [{ playerId }] = await trx
      .insert(playerAccount)
      .values({ userId, isBanned: false })
      .returning({ playerId: playerAccount.id });
    await trx.insert(playerPortfolio).values({
      playerId,
      bankBalance: initialBankBalance,
      stocks: stockData,
      totalPortfolioValue: 0,
    });
    await trx.insert(playerPowerups).values({
      playerId,
      insiderTradingStatus: 'Unused',
      muftKaPaisaStatus: 'Unused',
      stockBettingStatus: 'Unused',
    });

    return playerId;
  });
}
