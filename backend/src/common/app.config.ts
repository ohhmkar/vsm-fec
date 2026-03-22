import { config } from 'dotenv';
config();

export const cacheTime = process.env.CACHE_TIME ?? 0;
export const port = process.env.PORT ?? 8080;
export const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
