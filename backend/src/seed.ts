import { prisma } from './services/prisma.service';
import bcrypt from 'bcryptjs';

const STOCK_SEEDS = [
  { ticker: 'NVXA', basePrice: 100.0, volatility: 0.028 },
  { ticker: 'GRNX', basePrice: 100.0, volatility: 0.022 },
  { ticker: 'MDRX', basePrice: 100.0, volatility: 0.024 },
  { ticker: 'FNTX', basePrice: 100.0, volatility: 0.018 },
  { ticker: 'AERO', basePrice: 100.0, volatility: 0.02 },
  { ticker: 'LUXE', basePrice: 100.0, volatility: 0.025 },
  { ticker: 'OMKX', basePrice: 100.0, volatility: 0.035 },
  { ticker: 'AGRI', basePrice: 100.0, volatility: 0.019 },
  { ticker: 'STRM', basePrice: 100.0, volatility: 0.023 },
  { ticker: 'CYBX', basePrice: 100.0, volatility: 0.026 },
  { ticker: 'RLTY', basePrice: 100.0, volatility: 0.015 },
  { ticker: 'MOTO', basePrice: 100.0, volatility: 0.021 },
  { ticker: 'BRIX', basePrice: 100.0, volatility: 0.03 },
  { ticker: 'GLBL', basePrice: 100.0, volatility: 0.017 },
  { ticker: 'QUNT', basePrice: 100.0, volatility: 0.032 },
];

async function seed() {
  console.log('Seeding database...');
  try {
    for (const stock of STOCK_SEEDS) {
      await prisma.stock.upsert({
        where: { symbol: stock.ticker },
        update: {},
        create: {
          symbol: stock.ticker,
          roundIntroduced: 1,
          price: stock.basePrice,
          volatility: stock.volatility,
        },
      });
    }
    console.log('Successfully seeded 15 stocks!');

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
        u1Name: 'Manan',
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
