import {
  pgTable,
  smallint,
  doublePrecision,
  varchar,
  serial,
} from 'drizzle-orm/pg-core';

export const stockGameData = pgTable('stocks', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol').notNull(),
  forRound: smallint('round_applicable').notNull(),
  volatility: doublePrecision('volatility').notNull(),
});
