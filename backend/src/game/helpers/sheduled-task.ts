import { IGameState } from '../../types';
import {
  playerPortfolio,
  playerPowerups,
  stocks,
  stockGameData,
} from '../../models/index';
import { db } from '../../services/index';
import { eq, lte, sql } from 'drizzle-orm';
import { arrayToMap, roundTo2Places } from '../../common/utils';
import { muftPaisa } from '../../common/game.config';

function calculateNewStockPrice(price: number, volatility: number) {
  const valChange = (volatility + 100) / 100;
  return roundTo2Places(price * valChange);
}

export function updateStocks(gameState: IGameState) {
  return db.transaction(async (trx) => {
    const stocksData = await trx
      .select({
        symbol: stocks.symbol,
        price: stocks.price,
        currentVolatality: stocks.volatility,
      })
      .from(stocks)
      .where(lte(stocks.roundIntorduced, gameState.roundNo));

    const stockGameDataMap = arrayToMap(
      await trx
        .select()
        .from(stockGameData)
        .where(eq(stockGameData.forRound, gameState.roundNo + 1)),
      'symbol',
    );

    const updateAllStocks = stocksData.map((stockData) => {
      const newPrice = calculateNewStockPrice(
        stockData.price,
        stockData.currentVolatality,
      );
      return trx
        .update(stocks)
        .set({
          price: newPrice,
          volatility: stockGameDataMap.get(stockData.symbol)?.volatility ?? 0,
        })
        .where(eq(stocks.symbol, stockData.symbol));
    });
    await Promise.all(updateAllStocks);
  });
}

export function updatePlayerPortfolio(gameState: IGameState) {
  return db.transaction(async (trx) => {
    const players = await trx.select().from(playerPortfolio);
    const stocksData = arrayToMap(
      await trx
        .select()
        .from(stocks)
        .where(lte(stocks.roundIntorduced, gameState.roundNo)),
      'symbol',
    );

    const updateAllPlayerPortfolio = players.map((player) => {
      const playerPort = player.stocks;

      const totalPortfolioValue = playerPort.reduce((acc: number, stock) => {
        const stockVolumeOwned = stock.volume || 0;
        const stockValue = stocksData.get(stock.symbol)?.price || 0;
        return acc + stockVolumeOwned * stockValue;
      }, 0);

      return trx
        .update(playerPortfolio)
        .set({ totalPortfolioValue })
        .where(eq(playerPortfolio.playerId, player.playerId));
    });
    await Promise.all(updateAllPlayerPortfolio);
  });
}

export async function updatePlayerStatus() {
  return db.transaction(async (trx) => {
    const players = await trx.select().from(playerPowerups);
    const stocksData = arrayToMap(
      await trx.select({ price: stocks.price, id: stocks.symbol }).from(stocks),
      'id',
    );
    const updateAllPlayerStatus: Promise<object>[] = [];

    players.forEach((player) => {
      const muftKaPaisaStatus = player.muftKaPaisaStatus;
      const stockBettingStatus = player.stockBettingStatus;

      if (muftKaPaisaStatus === 'Active') {
        updateAllPlayerStatus.push(
          trx
            .update(playerPowerups)
            .set({ muftKaPaisaStatus: 'Used' })
            .where(eq(playerPowerups.playerId, player.playerId)),
        );
        updateAllPlayerStatus.push(
          trx
            .update(playerPortfolio)
            .set({
              bankBalance: sql`${playerPortfolio.bankBalance} - ${muftPaisa}`,
            })
            .where(eq(playerPortfolio.playerId, player.playerId)),
        );
      }

      if (stockBettingStatus === 'Active') {
        updateAllPlayerStatus.push(
          trx
            .update(playerPowerups)
            .set({ stockBettingStatus: 'Used' })
            .where(eq(playerPowerups.playerId, player.playerId)),
        );

        const stockBettingAmount = player.stockBettingAmount;
        const stockBettingPrediction = player.stockBettingPrediction;
        const stockBettingLockedPrice = player.stockBettingLockedPrice;
        const stockBettingLockedSymbol = player.stockBettingLockedSymbol;

        if (
          !stockBettingAmount ||
          !stockBettingPrediction ||
          !stockBettingLockedPrice ||
          !stockBettingLockedSymbol
        ) {
          throw new Error('Stock Betting data is missing.');
        }

        const newPrice = stocksData.get(stockBettingLockedSymbol)?.price;
        if (!newPrice) {
          throw new Error('Stock Betting data is missing.');
        }

        const actualPrediction =
          newPrice > stockBettingLockedPrice ? 'UP' : 'DOWN';
        const isPredictionCorrect = actualPrediction === stockBettingPrediction;

        if (isPredictionCorrect) {
          updateAllPlayerStatus.push(
            trx
              .update(playerPortfolio)
              .set({
                bankBalance: sql`${playerPortfolio.bankBalance} + ${2 * stockBettingAmount}`,
              })
              .where(eq(playerPortfolio.playerId, player.playerId)),
          );
        } else {
          updateAllPlayerStatus.push(
            trx
              .update(playerPortfolio)
              .set({
                bankBalance: sql`${playerPortfolio.bankBalance} - ${stockBettingAmount}`,
              })
              .where(eq(playerPortfolio.playerId, player.playerId)),
          );
        }
      }
    });

    await Promise.all(updateAllPlayerStatus);
  });
}
