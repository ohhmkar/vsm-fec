/** @type { import("drizzle-kit").Config } */
export default {
  schema: './src/models/*.model.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DB_URL,
  },
};
