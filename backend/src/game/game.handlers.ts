import { IGameState } from '../types';
import { NotFound, UnprocessableEntity } from '../errors/index';
import {
  news,
  playerAccount,
  playerPortfolio,
  playerPowerups,
  stocks,
  users,
} from '../models/index';
import { db } from '../services/index';
import { eq, and, lte, sql } from 'drizzle-orm';
import { arrayToMap } from '../common/utils';
import { muftPaisa } from '../common/game.config';

export function buyStock(
  playerId: string,
  stockId: string,
  quantity: number,
  gameState: IGameState,
) {
  return db.transaction(async (trx) => {
    const [stockData] = await trx
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.symbol, stockId),
          lte(stocks.roundIntorduced, gameState.roundNo),
        ),
      );
    const [playerPort] = await trx
      .select()
      .from(playerPortfolio)
      .where(eq(playerPortfolio.playerId, playerId));

    if (!stockData) {
      throw new NotFound('Stock not found');
    }
    if (!playerPort) {
      throw new NotFound('Player not found');
    }

    const balance = playerPort.bankBalance;
    const stockPrice = stockData.price;
    const totalCost = stockPrice * quantity;
    if (balance < totalCost) {
      throw new UnprocessableEntity('Insufficient funds');
    }

    const portStocks = playerPort.stocks;
    const stockIndex = portStocks.findIndex(
      (stock) => stock.symbol === stockId,
    );
    if (stockIndex === -1) {
      portStocks.push({ symbol: stockId, volume: quantity });
    } else {
      portStocks[stockIndex].volume += quantity;
    }

    await trx
      .update(playerPortfolio)
      .set({
        bankBalance: balance - totalCost,
        totalPortfolioValue: playerPort.totalPortfolioValue + totalCost,
        stocks: portStocks,
      })
      .where(eq(playerPortfolio.playerId, playerId));
  });
}

export function sellStock(
  playerId: string,
  stockId: string,
  quantity: number,
  gameState: IGameState,
) {
  return db.transaction(async (trx) => {
    const [stockData] = await trx
      .select()
      .from(stocks)
      .where(
        and(
          eq(stocks.symbol, stockId),
          lte(stocks.roundIntorduced, gameState.roundNo),
        ),
      );
    const [playerPort] = await trx
      .select()
      .from(playerPortfolio)
      .where(eq(playerPortfolio.playerId, playerId));

    if (!stockData) {
      throw new NotFound('Stock not found');
    }
    if (!playerPort) {
      throw new NotFound('Player not found');
    }

    const portStocks = playerPort.stocks;
    const stockIndex = portStocks.findIndex(
      (stock) => stock.symbol === stockId,
    );
    if (stockIndex === -1) {
      throw new UnprocessableEntity('Stock not found in portfolio');
    }
    if (portStocks[stockIndex].volume < quantity) {
      throw new UnprocessableEntity('Insufficient stocks');
    }

    const stockPrice = stockData.price;
    const totalCost = stockPrice * quantity;
    portStocks[stockIndex].volume -= quantity;

    await trx
      .update(playerPortfolio)
      .set({
        bankBalance: playerPort.bankBalance + totalCost,
        totalPortfolioValue: playerPort.totalPortfolioValue - totalCost,
        stocks: portStocks,
      })
      .where(eq(playerPortfolio.playerId, playerId));
  });
}

export async function getNews(gameState: IGameState) {
  const newsData = await db
    .select({ content: news.content })
    .from(news)
    .where(
      and(
        eq(news.roundApplicable, gameState.roundNo),
        eq(news.forInsider, false),
      ),
    );
  return newsData.map((newsContent) => newsContent.content);
}

export async function getStocks(gameState: IGameState) {
  return db
    .select({ id: stocks.symbol, value: stocks.price })
    .from(stocks)
    .where(lte(stocks.roundIntorduced, gameState.roundNo));
}

export function getLeaderboard() {
  return db.transaction(async (trx) => {
    const playersData = await trx
      .select({
        id: playerPortfolio.playerId,
        wealth: sql<number>`(total_portfolio_value + bank_balance)`,
      })
      .from(playerPortfolio)
      .orderBy(sql`(total_portfolio_value + bank_balance) DESC`);
    const usernames = arrayToMap(
      await trx
        .select({
          id: playerAccount.id,
          u1: users.u1Name,
          u2: users.u2Name,
        })
        .from(playerAccount)
        .innerJoin(users, eq(playerAccount.userId, users.id)),
      'id',
    );
    const leaderboard = playersData.map((player, index) => {
      const u1 = usernames.get(player.id)?.u1;
      const u2 = usernames.get(player.id)?.u2;
      const name = u2 ? `${u1} & ${u2}` : u1;
      return {
        rank: index + 1,
        name: name,
        wealth: player.wealth,
      };
    });

    return leaderboard;
  });
}

export async function getPlayerProfile(playerId: string) {
  const [playerProfile] = await db
    .select({
      balance: playerPortfolio.bankBalance,
      valuation: playerPortfolio.totalPortfolioValue,
    })
    .from(playerPortfolio)
    .where(eq(playerPortfolio.playerId, playerId));

  return playerProfile;
}

export async function getPlayerPortfolio(playerId: string) {
  return db.transaction(async (trx) => {
    const [playerData] = await trx
      .select({
        stocks: playerPortfolio.stocks,
        valuation: playerPortfolio.totalPortfolioValue,
      })
      .from(playerPortfolio)
      .where(eq(playerPortfolio.playerId, playerId));
    const stocksData = arrayToMap(await trx.select().from(stocks), 'symbol');
    const playerPort = playerData.stocks;
    const portfolio = playerPort.map((stock) => {
      const value = stocksData.get(stock.symbol)?.price || 0;
      return { name: stock.symbol, volume: stock.volume, value };
    });

    return {
      valuation: playerData.valuation,
      portfolio,
    };
  });
}

export async function getPlayerBalence(playerId: string) {
  const [playerData] = await db
    .select({ balance: playerPortfolio.bankBalance })
    .from(playerPortfolio)
    .where(eq(playerPortfolio.playerId, playerId));

  return { balance: playerData.balance };
}

export async function useInsiderTrading(
  playerId: string,
  gameState: IGameState,
) {
  return db.transaction(async (trx) => {
    const [{ status }] = await trx
      .select({ status: playerPowerups.insiderTradingStatus })
      .from(playerPowerups)
      .where(eq(playerPowerups.playerId, playerId));

    if (!status) {
      throw new NotFound('Player not found');
    }

    if (status == 'Used') {
      throw new UnprocessableEntity('Insider Trading already used');
    }

    await trx
      .update(playerPowerups)
      .set({ insiderTradingStatus: 'Used' })
      .where(eq(playerPowerups.playerId, playerId));

    const newsData = await trx
      .select({ content: news.content })
      .from(news)
      .where(
        and(
          eq(news.roundApplicable, gameState.roundNo),
          eq(news.forInsider, true),
        ),
      );

    return newsData.map((newsContent) => newsContent.content);
  });
}

export async function useMuftKaPaisa(playerId: string) {
  return db.transaction(async (trx) => {
    const [{ status }] = await trx
      .select({ status: playerPowerups.muftKaPaisaStatus })
      .from(playerPowerups)
      .where(eq(playerPowerups.playerId, playerId));

    if (!status) {
      throw new NotFound('Player not found');
    }

    if (status == 'Used') {
      throw new UnprocessableEntity('Muft Ka Paisa already used');
    }

    await trx
      .update(playerPowerups)
      .set({ muftKaPaisaStatus: 'Active' })
      .where(eq(playerPowerups.playerId, playerId));

    await trx
      .update(playerPortfolio)
      .set({ bankBalance: sql`${playerPortfolio.bankBalance} + ${muftPaisa}` })
      .where(eq(playerPortfolio.playerId, playerId));
  });
}

export async function useStockBetting(
  playerId: string,
  stockBettingAmount: number,
  stockBettingPrediction: 'UP' | 'DOWN',
  stockBettingLockedSymbol: string,
) {
  return db.transaction(async (trx) => {
    const [{ status }] = await trx
      .select({ status: playerPowerups.stockBettingStatus })
      .from(playerPowerups)
      .where(eq(playerPowerups.playerId, playerId));

    if (!status) {
      throw new NotFound('Player not found');
    }

    if (status == 'Used') {
      throw new UnprocessableEntity('Stock Betting already used');
    }

    const [{ bankBalance }] = await trx
      .select({ bankBalance: playerPortfolio.bankBalance })
      .from(playerPortfolio)
      .where(eq(playerPortfolio.playerId, playerId));

    if (bankBalance < stockBettingAmount) {
      throw new UnprocessableEntity('Insufficient funds');
    }

    await trx
      .update(playerPortfolio)
      .set({
        bankBalance: bankBalance - stockBettingAmount,
      })
      .where(eq(playerPortfolio.playerId, playerId));

    const [{ price: stockBettingLockedPrice }] = await trx
      .select({ price: stocks.price })
      .from(stocks)
      .where(eq(stocks.symbol, stockBettingLockedSymbol));

    await trx
      .update(playerPowerups)
      .set({
        stockBettingStatus: 'Active',
        stockBettingAmount,
        stockBettingPrediction,
        stockBettingLockedPrice,
        stockBettingLockedSymbol,
      })
      .where(eq(playerPowerups.playerId, playerId));
  });
}
