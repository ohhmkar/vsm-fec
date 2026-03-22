import { pgTable, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from './user.model';

export const playerAccount = pgTable('player_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  isBanned: boolean('is_banned').notNull().default(false),
});
