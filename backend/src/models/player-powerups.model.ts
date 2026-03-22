import {
  pgTable,
  uuid,
  char,
  doublePrecision,
  varchar,
} from 'drizzle-orm/pg-core';
import { playerAccount } from './player-account.model';

export const playerPowerups = pgTable('player_powerups', {
  playerId: uuid('player_id')
    .references(() => playerAccount.id, {
      onDelete: 'cascade',
    })
    .notNull()
    .primaryKey(),
  insiderTradingStatus: varchar('insider_trading_status', {
    enum: ['Unused', 'Used'],
  })
    .notNull()
    .default('Unused'),
  muftKaPaisaStatus: varchar('muft_ka_paisa_status', {
    enum: ['Unused', 'Active', 'Used'],
  })
    .notNull()
    .default('Unused'),
  stockBettingStatus: varchar('stock_betting_status', {
    enum: ['Unused', 'Active', 'Used'],
  })
    .notNull()
    .default('Unused'),
  stockBettingAmount: doublePrecision('stock_betting_amount'),
  stockBettingPrediction: char('stock_betting_prediction', {
    enum: ['UP', 'DOWN'],
  }),
  stockBettingLockedSymbol: varchar('stock_betting_locked_symbol'),
  stockBettingLockedPrice: doublePrecision('stock_betting_locked_price'),
});
