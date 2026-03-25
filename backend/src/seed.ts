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
  { ticker: 'PETR', name: 'Petronyx Materials', sector: 'Specialty Chemicals', basePrice: 42, volatility: 0.025 },
  { ticker: 'AGRI', name: 'AgriNova Consumer', sector: 'FMCG', basePrice: 18, volatility: 0.02 },
  { ticker: 'CRED', name: 'Credixa Finance', sector: 'NBFC', basePrice: 27, volatility: 0.028 },
  { ticker: 'BLUE', name: 'BlueOrbit Tech', sector: 'IT Services', basePrice: 55, volatility: 0.03 },
  { ticker: 'GRID', name: 'GridFlow Exchange', sector: 'Power Exchange', basePrice: 33, volatility: 0.022 },
  { ticker: 'INFR', name: 'InfraForge Engineering', sector: 'Capital Goods', basePrice: 61, volatility: 0.018 },
  { ticker: 'AURU', name: 'Aurum Luxe Retail', sector: 'Jewellery Retail', basePrice: 74, volatility: 0.024 },
  { ticker: 'TRSP', name: 'TradeSphere Ltd.', sector: 'Stock Exchange', basePrice: 120, volatility: 0.015 },
  { ticker: 'SCRT', name: 'SecureLife Insurance', sector: 'Insurance', basePrice: 39, volatility: 0.02 },
  { ticker: 'MEDC', name: 'MediCore Hospitals', sector: 'Hospital Chain', basePrice: 88, volatility: 0.022 },
  { ticker: 'VOLT', name: 'VoltEdge Renewables', sector: 'Renewable Energy', basePrice: 25, volatility: 0.028 },
  { ticker: 'TITA', name: 'TitanAlloy Metals', sector: 'Metals', basePrice: 47, volatility: 0.026 },
  { ticker: 'URBC', name: 'UrbanCart Quick', sector: 'Quick Commerce', basePrice: 15, volatility: 0.035 },
  { ticker: 'FIBR', name: 'FiberLink Logistics', sector: 'Logistics', basePrice: 52, volatility: 0.023 },
  { ticker: 'NEXT', name: 'NextGen Semicon', sector: 'Semiconductors', basePrice: 95, volatility: 0.032 },
  { ticker: 'FINV', name: 'Finverse Brokers', sector: 'Retail Brokerage', basePrice: 21, volatility: 0.03 },
  { ticker: 'GRNF', name: 'GreenFuel Fertchem', sector: 'Fertilizers', basePrice: 29, volatility: 0.027 },
  { ticker: 'HELX', name: 'HelixBio Pharma', sector: 'Pharma Exports', basePrice: 63, volatility: 0.025 },
  // Adding IPO stock examples
  { ticker: 'ZETA', name: 'Zeta FutureCorp', sector: 'Semiconductors', basePrice: 150, volatility: 0.04, availableInIPO: true, ipoRound: 5, ipoPrice: 140 },
  { ticker: 'OMEG', name: 'Omega Dynamics', sector: 'Defense', basePrice: 200, volatility: 0.035, availableInIPO: true, ipoRound: 8, ipoPrice: 190 },
];

async function seed() {
  console.log('Seeding database...');
  try {
    for (const stock of STOCK_SEEDS) {
      const data = {
        name: stock.name,
        sector: stock.sector,
        roundIntroduced: stock.ipoRound ?? 1,
        price: stock.basePrice,
        volatility: stock.volatility,
        ipoRound: stock.ipoRound,
        ipoPrice: stock.ipoPrice,
        availableInIPO: stock.availableInIPO ?? false,
      };

      await prisma.stock.upsert({
        where: { symbol: stock.ticker },
        update: {
          ...data,
          price: undefined, // Don't reset price on re-seed if stock exists
          roundIntroduced: stock.ipoRound ?? 1,
        },
        create: {
          symbol: stock.ticker,
          ...data
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