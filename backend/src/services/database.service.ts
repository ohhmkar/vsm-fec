import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
config();

const connStr = process.env.DB_URL || '';
const connection = postgres(connStr, { prepare: false });
export const db = drizzle(connection);
