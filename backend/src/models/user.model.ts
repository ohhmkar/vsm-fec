import { pgTable, uuid, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  u1Name: varchar('u1Name').notNull(),
  u2Name: varchar('u2Name'),
  isAdmin: boolean('is_admin').notNull().default(false),
});
