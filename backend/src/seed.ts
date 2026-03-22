import { db } from './services/index';
import { stocks, users } from './models/index';
import bcrypt from 'bcryptjs';

const STOCK_SEEDS = [
  { ticker: 'NVXA', basePrice: 100.00, volatility: 0.028 },
  { ticker: 'GRNX', basePrice: 100.00,volatility: 0.022 },
  { ticker: 'MDRX', basePrice: 100.00, volatility: 0.024 },
  { ticker: 'FNTX', basePrice: 100.00,volatility: 0.018 },
  { ticker: 'AERO', basePrice: 100.00, volatility: 0.02 },
  { ticker: 'LUXE', basePrice: 100.00,volatility: 0.025 },
  { ticker: 'OMKX', basePrice: 100.00, volatility: 0.035 },
  { ticker: 'AGRI', basePrice: 100.00,volatility: 0.019 },
  { ticker: 'STRM', basePrice: 100.00,volatility: 0.023 },
  { ticker: 'CYBX', basePrice: 100.00, volatility: 0.026 },
  { ticker: 'RLTY', basePrice: 100.00,volatility: 0.015 },
  { ticker: 'MOTO', basePrice: 100.00, volatility: 0.021 },
  { ticker: 'BRIX', basePrice: 100.00,volatility: 0.03 },
  { ticker: 'GLBL', basePrice: 100.00,volatility: 0.017 },
  { ticker: 'QUNT', basePrice: 100.00, volatility: 0.032 },
];

async function seed() {
  console.log('Seeding database...');
  try {
    // Seed Stocks
    for (const seed of STOCK_SEEDS) {
      await db.insert(stocks).values({
        symbol: seed.ticker,
        roundIntorduced: 1, // Available from the start
        price: seed.basePrice,
        volatility: seed.volatility
      }).onConflictDoNothing(); // Prevent errors if ran multiple times
    }
    console.log('Successfully seeded 15 stocks!');

    // Seed Admin User
    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpassword';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      u1Name: 'Admin',
      u2Name: 'SuperUser',
      isAdmin: true,
    }).onConflictDoNothing();
    console.log(`Successfully seeded Admin user! (Email: ${adminEmail}, Password: ${adminPassword})`);

  } catch (err) {
    console.error('Failed to seed:', err);
  }
  process.exit(0);
}

seed();
