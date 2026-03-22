import { db } from './services/index';
import { stocks } from './models/index';

const STOCK_SEEDS = [
  { ticker: 'NVXA', basePrice: 287.50, volatility: 0.028 },
  { ticker: 'GRNX', basePrice: 64.20, volatility: 0.022 },
  { ticker: 'MDRX', basePrice: 156.80, volatility: 0.024 },
  { ticker: 'FNTX', basePrice: 89.40, volatility: 0.018 },
  { ticker: 'AERO', basePrice: 198.60, volatility: 0.02 },
  { ticker: 'LUXE', basePrice: 42.30, volatility: 0.025 },
  { ticker: 'OMKX', basePrice: 124.70, volatility: 0.035 },
  { ticker: 'AGRI', basePrice: 37.90, volatility: 0.019 },
  { ticker: 'STRM', basePrice: 78.50, volatility: 0.023 },
  { ticker: 'CYBX', basePrice: 215.30, volatility: 0.026 },
  { ticker: 'RLTY', basePrice: 52.10, volatility: 0.015 },
  { ticker: 'MOTO', basePrice: 147.20, volatility: 0.021 },
  { ticker: 'BRIX', basePrice: 93.60, volatility: 0.03 },
  { ticker: 'GLBL', basePrice: 68.80, volatility: 0.017 },
  { ticker: 'QUNT', basePrice: 312.40, volatility: 0.032 },
];

async function seed() {
  console.log('Seeding stocks to database...');
  try {
    for (const seed of STOCK_SEEDS) {
      await db.insert(stocks).values({
        symbol: seed.ticker,
        roundIntorduced: 1, // Available from the start
        price: seed.basePrice,
        volatility: seed.volatility
      }).onConflictDoNothing(); // Prevent errors if ran multiple times
    }
    console.log('Successfully seeded 15 stocks!');
  } catch (err) {
    console.error('Failed to seed stocks:', err);
  }
  process.exit(0);
}

seed();
