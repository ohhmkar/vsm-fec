import { IGameState } from '../../types';
import { prisma } from '../../services/prisma.service';
import { arrayToMap, roundTo2Places } from '../../common/utils';
import { broadcastNotification } from '../../services/socket.service';

function calculateNewStockPrice(price: number, volatility: number) {
  const valChange = (volatility + 100) / 100;
  return roundTo2Places(price * valChange);
}

export async function updatePlayerStatus() {
  // Placeholder function to update player status
  console.log('Updating Player Status...');
  await prisma.playerPowerups.updateMany({
    where: { muftKaPaisaStatus: 'Active' },
    data: { muftKaPaisaStatus: 'Used' },
  });
  console.log('Updated Player Powerup Status.');
}

export async function processDividends(gameState: IGameState) {
  const declarations = await prisma.dividendDeclaration.findMany({
    where: {
      round: gameState.roundNo,
      processed: false,
    },
  });

  if (declarations.length === 0) return;

  for (const declaration of declarations) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: declaration.symbol },
    });

    if (!stock || stock.dividendAmount <= 0) continue;

    const portfolios = await prisma.playerPortfolio.findMany();
    const dividendsPaid: { playerId: string; amount: number }[] = [];

    for (const portfolio of portfolios) {
      const holdings = portfolio.stocks as any[];
      const stockHolding = holdings.find((h: any) => h.symbol === declaration.symbol);

      if (stockHolding && stockHolding.volume > 0) {
        const dividendAmount = stockHolding.volume * declaration.amount;
        
        await prisma.playerPortfolio.update({
          where: { playerId: portfolio.playerId },
          data: {
            bankBalance: { increment: dividendAmount },
            totalPortfolioValue: { increment: dividendAmount },
          },
        });

        dividendsPaid.push({ playerId: portfolio.playerId, amount: dividendAmount });
      }
    }

    await prisma.dividendDeclaration.update({
      where: { id: declaration.id },
      data: { processed: true },
    });

    broadcastNotification(
      `${declaration.symbol} declared Rs.${declaration.amount.toFixed(2)} dividend per share. ${dividendsPaid.length} shareholders received dividends.`,
      'success'
    );
  }
}

export async function clearPlayerRoundData() {
  await prisma.playerAccount.updateMany({
    data: {
      recentlySoldStocks: [],
    },
  });
}

export async function unlockIPOShares(gameState: IGameState) {
  const nextRound = gameState.roundNo + 1;
  
  await prisma.playerAccount.updateMany({
    data: {
      ipoClaimedSymbols: [],
    },
  });

  console.log(`[IPO] Unlocked IPO shares for Round ${nextRound}`);
}

export async function updateStocks(gameState: IGameState) {
  return prisma.$transaction(async (tx) => {
    const stocksData = await tx.stock.findMany({
      where: {
        roundIntroduced: {
          lte: gameState.roundNo,
        },
      },
      select: {
        symbol: true,
        price: true,
        volatility: true,
      },
    });

    const nextGameData = await tx.stockGameData.findMany({
      where: {
        forRound: gameState.roundNo + 1,
      },
    });
    const nextGameDataMap = arrayToMap(nextGameData, 'symbol');

    for (const stock of stocksData) {
      const newPrice = calculateNewStockPrice(stock.price, stock.volatility);
      const nextVolatility = nextGameDataMap.get(stock.symbol)?.volatility ?? 0;

      await tx.stock.update({
        where: { symbol: stock.symbol },
        data: {
          price: newPrice,
          volatility: nextVolatility,
        },
      });
    }
  });
}

export async function updatePlayerPortfolio(gameState: IGameState) {
  return prisma.$transaction(async (tx) => {
    const players = await tx.playerPortfolio.findMany(); // Assuming all portfolios needed
    const activeStocks = await tx.stock.findMany({
      where: {
        roundIntroduced: {
          lte: gameState.roundNo,
        },
      },
    });
    const stocksMap = arrayToMap(activeStocks, 'symbol');

    for (const player of players) {
      const playerStocks = player.stocks as any[]; // Need defined type for stocks JSON
      if (!Array.isArray(playerStocks)) continue;

      const totalValue = playerStocks.reduce((acc, s) => {
        const volume = s.volume || 0;
        const price = stocksMap.get(s.symbol)?.price || 0;
        return acc + volume * price;
      }, 0);

      await tx.playerPortfolio.update({
        where: { playerId: player.playerId },
        data: {
          totalPortfolioValue: totalValue,
        },
      });
    }
  });
}
