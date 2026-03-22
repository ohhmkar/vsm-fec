import { prisma } from '../../services/prisma.service';

export async function uploadNews(
  newsData: {
    content: string;
    forInsider: boolean;
    roundApplicable: number;
  }[],
) {
  await prisma.news.createMany({
    data: newsData,
  });
}

export async function uploadStock(
  stockData: {
    symbol: string;
    volatility: number;
    price: number;
    roundIntorduced: number;
  }[],
) {
  const data = stockData.map((s) => ({
    symbol: s.symbol,
    volatility: s.volatility,
    price: s.price,
    roundIntroduced: s.roundIntorduced,
  }));
  await prisma.stock.createMany({
    data,
  });
}

export async function uploadStockUpdate(
  stockData: {
    symbol: string;
    volatility: number;
    forRound: number;
  }[],
) {
  await prisma.stockGameData.createMany({
    data: stockData,
  });
}

export async function flushDatabase() {
  await prisma.news.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.playerAccount.deleteMany();
}

export async function flushPlayerTable() {
  await prisma.playerAccount.deleteMany();
}

export async function flushUserTable() {
  await prisma.user.deleteMany();
}
