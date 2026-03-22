import { pgTable, uuid, doublePrecision, json } from 'drizzle-orm/pg-core';
import { playerAccount } from './player-account.model';

export const playerPortfolio = pgTable('player_portfolio', {
  playerId: uuid('player_id')
    .references(() => playerAccount.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .primaryKey(),
  bankBalance: doublePrecision('bank_balance').notNull(),
  totalPortfolioValue: doublePrecision('total_portfolio_value').notNull(),
  stocks: json('stocks')
    .$type<{ symbol: string; volume: number }[]>()
    .notNull(),
});
