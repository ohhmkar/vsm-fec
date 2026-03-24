import { prisma } from '../services/prisma.service';
import { NotFound, UnprocessableEntity } from '../errors/index';
import { broadcastNotification } from './socket.service';

interface EligibleUser {
  userId: string;
  userName: string;
  email: string;
  holdingSectors: string[];
  portfolioValue: number;
  holdings: { symbol: string; volume: number }[];
}

interface IPOAllocationInput {
  playerId: string;
  symbol: string;
  quantity: number;
  round: number;
}

export async function getIPOEligibilityList(excludeSector?: string): Promise<EligibleUser[]> {
  const portfolios = await prisma.playerPortfolio.findMany({
    include: {
      player: {
        include: {
          user: {
            select: {
              id: true,
              u1Name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const stocks = await prisma.stock.findMany({
    select: { symbol: true, sector: true, name: true },
  });

  const stocksMap = new Map(stocks.map(s => [s.symbol, s]));

  const eligibleUsers: EligibleUser[] = [];

  for (const portfolio of portfolios) {
    if (!portfolio.player?.user) continue;

    const holdings = portfolio.stocks as any[];
    const holdingSectors: string[] = [];
    const userHoldings: { symbol: string; volume: number }[] = [];

    for (const holding of holdings) {
      if (holding.volume > 0) {
        userHoldings.push({ symbol: holding.symbol, volume: holding.volume });
        const stockInfo = stocksMap.get(holding.symbol);
        const sector = stockInfo?.sector;
        if (sector && !holdingSectors.includes(sector)) {
          holdingSectors.push(sector);
        }
      }
    }

    if (excludeSector && holdingSectors.includes(excludeSector)) {
      continue;
    }

    eligibleUsers.push({
      userId: portfolio.player.user.id,
      userName: portfolio.player.user.u1Name,
      email: portfolio.player.user.email,
      holdingSectors,
      portfolioValue: portfolio.bankBalance + portfolio.totalPortfolioValue,
      holdings: userHoldings,
    });
  }

  return eligibleUsers.sort((a, b) => b.portfolioValue - a.portfolioValue);
}

export async function getAvailableIPOStocks() {
  return prisma.stock.findMany({
    where: {
      availableInIPO: true,
    },
    select: {
      symbol: true,
      name: true,
      sector: true,
      ipoPrice: true,
      ipoRound: true,
      price: true,
    },
  });
}

export async function allocateIPOStocks(allocations: IPOAllocationInput[]): Promise<{ success: boolean; allocated: number; allocations: any[] }> {
  const createdAllocations: any[] = [];
  let allocated = 0;

  for (const alloc of allocations) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: alloc.symbol },
    });

    if (!stock) {
      throw new NotFound(`Stock ${alloc.symbol} not found`);
    }

    if (!stock.availableInIPO) {
      throw new UnprocessableEntity(`Stock ${alloc.symbol} is not available for IPO`);
    }

    const existingAllocation = await prisma.iPOAllocation.findUnique({
      where: {
        playerId_symbol_round: {
          playerId: alloc.playerId,
          symbol: alloc.symbol,
          round: alloc.round,
        },
      },
    });

    if (existingAllocation) {
      const updated = await prisma.iPOAllocation.update({
        where: { id: existingAllocation.id },
        data: { quantity: alloc.quantity },
      });
      createdAllocations.push(updated);
    } else {
      const created = await prisma.iPOAllocation.create({
        data: {
          playerId: alloc.playerId,
          symbol: alloc.symbol,
          quantity: alloc.quantity,
          price: stock.ipoPrice || stock.price,
          round: alloc.round,
          claimed: false,
        },
      });
      createdAllocations.push(created);
    }

    allocated++;
  }

  return { success: true, allocated, allocations: createdAllocations };
}

export async function removeIPOAllocation(playerId: string, symbol: string, round: number): Promise<boolean> {
  const allocation = await prisma.iPOAllocation.findUnique({
    where: {
      playerId_symbol_round: {
        playerId,
        symbol,
        round,
      },
    },
  });

  if (!allocation) {
    return false;
  }

  if (allocation.claimed) {
    throw new UnprocessableEntity('Cannot remove claimed IPO allocation');
  }

  await prisma.iPOAllocation.delete({
    where: { id: allocation.id },
  });

  return true;
}

export async function claimIPOStock(playerId: string, symbol: string, round: number) {
  const allocation = await prisma.iPOAllocation.findUnique({
    where: {
      playerId_symbol_round: {
        playerId,
        symbol,
        round,
      },
    },
  });

  if (!allocation) {
    throw new NotFound('IPO allocation not found');
  }

  if (allocation.claimed) {
    throw new UnprocessableEntity('IPO shares already claimed');
  }

  const stock = await prisma.stock.findUnique({
    where: { symbol },
  });

  if (!stock) {
    throw new NotFound('Stock not found');
  }

  const totalCost = allocation.quantity * allocation.price;

  await prisma.$transaction(async (tx) => {
    const portfolio = await tx.playerPortfolio.findUnique({
      where: { playerId },
    });

    if (!portfolio) {
      throw new NotFound('Portfolio not found');
    }

    if (portfolio.bankBalance < totalCost) {
      throw new UnprocessableEntity('Insufficient funds to claim IPO shares');
    }

    const holdings = portfolio.stocks as any[];
    const existingHolding = holdings.find((h: any) => h.symbol === symbol);

    if (existingHolding) {
      const oldVolume = existingHolding.volume;
      const oldAvgCost = existingHolding.avgCost || 0;
      const newVolume = oldVolume + allocation.quantity;
      const newAvgCost = (oldVolume * oldAvgCost + allocation.quantity * allocation.price) / newVolume;
      existingHolding.volume = newVolume;
      existingHolding.avgCost = newAvgCost;
    } else {
      holdings.push({
        symbol,
        volume: allocation.quantity,
        avgCost: allocation.price,
      });
    }

    await tx.playerPortfolio.update({
      where: { playerId },
      data: {
        bankBalance: { decrement: totalCost },
        totalPortfolioValue: { increment: totalCost },
        stocks: holdings,
      },
    });

    await tx.iPOAllocation.update({
      where: { id: allocation.id },
      data: { claimed: true },
    });

    const playerAccount = await tx.playerAccount.findUnique({
      where: { id: playerId },
    });

    const ipoClaimed = (playerAccount?.ipoClaimedSymbols || []) as string[];
    if (!ipoClaimed.includes(symbol)) {
      ipoClaimed.push(symbol);
      await tx.playerAccount.update({
        where: { id: playerId },
        data: { ipoClaimedSymbols: ipoClaimed },
      });
    }
  });

  broadcastNotification(
    `IPO Claimed: ${symbol} - ${allocation.quantity} shares at Rs.${allocation.price.toFixed(2)}`,
    'success'
  );

  return {
    symbol,
    quantity: allocation.quantity,
    price: allocation.price,
    totalCost,
  };
}

interface PendingAllocationResult {
  id: string;
  playerId: string;
  symbol: string;
  quantity: number;
  price: number;
  round: number;
  claimed: boolean;
  createdAt: Date;
}

export async function getPendingIPOAllocations(playerId: string): Promise<PendingAllocationResult[]> {
  const allocations = await prisma.iPOAllocation.findMany({
    where: {
      playerId,
      claimed: false,
    },
    orderBy: { round: 'asc' },
  });
  return allocations;
}

interface AllAllocationResult {
  id: string;
  playerId: string;
  symbol: string;
  quantity: number;
  price: number;
  round: number;
  claimed: boolean;
  createdAt: Date;
}

export async function getAllIPOAllocations(round?: number): Promise<AllAllocationResult[]> {
  const where = round ? { round } : {};
  const allocations = await prisma.iPOAllocation.findMany({
    where,
    orderBy: [{ round: 'asc' }, { symbol: 'asc' }],
  });
  return allocations;
}
