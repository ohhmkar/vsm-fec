import { pgTable, boolean, serial, smallint, text } from 'drizzle-orm/pg-core';

export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  roundApplicable: smallint('round_applicable').notNull(),
  content: text('content').notNull(),
  forInsider: boolean('for_insider').notNull().default(false),
});
