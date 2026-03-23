import { prisma } from './services/prisma.service';
import bcrypt from 'bcryptjs';

interface StockSeed {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number;
  ipoRound?: number;
  ipoPrice?: number;
  availableInIPO?: boolean;
}

const STOCK_SEEDS: StockSeed[] = [
  { ticker: 'NVXA', name: 'NovaTech AI Systems', sector: 'Technology', basePrice: 100.0, volatility: 0.028 },
  { ticker: 'GRNX', name: 'GreenWave Energy Corp', sector: 'Energy', basePrice: 100.0, volatility: 0.022 },
  { ticker: 'MDRX', name: 'MedCore Pharmaceuticals', sector: 'Healthcare', basePrice: 100.0, volatility: 0.024 },
  { ticker: 'FNTX', name: 'Fintera Banking Group', sector: 'Finance', basePrice: 100.0, volatility: 0.018 },
  { ticker: 'AERO', name: 'Apex Aerospace Inc', sector: 'Industrials', basePrice: 100.0, volatility: 0.02 },
  { ticker: 'LUXE', name: 'Luminary Retail Holdings', sector: 'Consumer Discretionary', basePrice: 100.0, volatility: 0.025 },
  { ticker: 'OMKX', name: 'Omkar Crypto Exchange', sector: 'Finance', basePrice: 100.0, volatility: 0.035 },
  { ticker: 'AGRI', name: 'AgriVault Commodities', sector: 'Materials', basePrice: 100.0, volatility: 0.019 },
  { ticker: 'STRM', name: 'StreamVault Media', sector: 'Communication', basePrice: 100.0, volatility: 0.023 },
  { ticker: 'CYBX', name: 'CyberShield Security', sector: 'Technology', basePrice: 100.0, volatility: 0.026 },
  { ticker: 'RLTY', name: 'RealNest Property Trust', sector: 'Real Estate', basePrice: 100.0, volatility: 0.015 },
  { ticker: 'MOTO', name: 'MotorFlex Automotive', sector: 'Consumer Discretionary', basePrice: 100.0, volatility: 0.021 },
  { ticker: 'BRIX', name: 'BioRix Life Sciences', sector: 'Healthcare', basePrice: 100.0, volatility: 0.03 },
  { ticker: 'GLBL', name: 'GlobalRoute Logistics', sector: 'Industrials', basePrice: 100.0, volatility: 0.017 },
  { ticker: 'QUNT', name: 'Quantum Data Infrastructure', sector: 'Technology', basePrice: 100.0, volatility: 0.032 },
  { ticker: 'OILI', name: 'OilCo Petrochemicals', sector: 'Energy', basePrice: 200.0, volatility: 0.025, ipoRound: 5, ipoPrice: 200.0, availableInIPO: true },
  { ticker: 'TECH', name: 'TechVentures Capital', sector: 'Technology', basePrice: 350.0, volatility: 0.035, ipoRound: 5, ipoPrice: 350.0, availableInIPO: true },
];

async function seed() {
  console.log('Seeding database...');
  try {
    for (const stock of STOCK_SEEDS) {
      await prisma.stock.upsert({
        where: { symbol: stock.ticker },
        update: {
          name: stock.name,
          sector: stock.sector,
          ipoRound: stock.ipoRound,
          ipoPrice: stock.ipoPrice,
          availableInIPO: stock.availableInIPO ?? false,
        },
        create: {
          symbol: stock.ticker,
          name: stock.name,
          sector: stock.sector,
          roundIntroduced: stock.ipoRound ?? 1,
          price: stock.basePrice,
          volatility: stock.volatility,
          ipoRound: stock.ipoRound,
          ipoPrice: stock.ipoPrice,
          availableInIPO: stock.availableInIPO ?? false,
        },
      });
    }
    console.log(`Successfully seeded ${STOCK_SEEDS.length} stocks!`);

    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpassword';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashedPassword,
        u1Name: 'Admin',
        u2Name: 'SuperUser',
        isAdmin: true,
      },
    });
    console.log(
      `Successfully seeded Admin user! (Email: ${adminEmail}, Password: ${adminPassword})`,
    );

    const userSeeds = [
      {
        email: 'manan@example.com',
        password: 'manan123',
        u1Name: 'manan',
        u2Name: 'Player1',
        isAdmin: false,
      },
      {
        email: 'omkar@example.com',
        password: 'omkar123',
        u1Name: 'Omkar',
        u2Name: 'Player2',
        isAdmin: true,
      },
      {
        email: 'atharva@example.com',
        password: 'atharva123',
        u1Name: 'Atharva',
        u2Name: 'Player3',
        isAdmin: false,
      },
    ];

    for (const user of userSeeds) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          password: hashedPassword,
          u1Name: user.u1Name,
          u2Name: user.u2Name,
          isAdmin: user.isAdmin,
        },
      });
      console.log(
        `Successfully seeded user! (Email: ${user.email}, Password: ${user.password})`,
      );
    }
  } catch (error) {
    console.error('Failed to seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
