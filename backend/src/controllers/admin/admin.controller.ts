import type { ReqHandler } from '../../types';
import type {
  IAddNewsRequestDto,
  IAddStockRequestDto,
  IAddStockUpdateDataDto,
  INotifyRequestDto,
} from './admin.controller.dto';
import { StatusCodes } from 'http-status-codes';
import {
  flushDatabase,
  flushPlayerTable,
  flushUserTable,
  resetGameData,
  uploadNews,
  uploadStock,
  uploadStockUpdate,
} from '../../game/helpers/chore';
import { startGame, startRound, terminateGame, extendActiveRound, forceEndRound, pauseGame, resumeGame } from '../../game/game';
import { gameService } from '../../services/game.logic';
import { broadcastNotification, broadcastGameReset, broadcastStaggeredNews } from '../../services/socket.service';
import { prisma } from '../../services/prisma.service';
import { getIPOEligibilityList, allocateIPOStocks, removeIPOAllocation, getAvailableIPOStocks, getAllIPOAllocations } from '../../services/ipo.service';
import { generateAndStoreNews } from '../../services/news-generator.service';

// --- Pause Handlers ---
export const pauseGameHandler: ControlEndpointHandler = async (req, res) => {
  const success = pauseGame();
  if (success) res.status(StatusCodes.OK).json({ status: 'Success' });
  else res.status(StatusCodes.BAD_REQUEST).json({ status: 'Failure', message: 'Cannot pause' });
};

export const resumeGameHandler: ControlEndpointHandler = async (req, res) => {
  const success = resumeGame();
  if (success) res.status(StatusCodes.OK).json({ status: 'Success' });
  else res.status(StatusCodes.BAD_REQUEST).json({ status: 'Failure', message: 'Cannot resume' });
};

type AddNewsHandler = ReqHandler<IAddNewsRequestDto>;

export const addNews: AddNewsHandler = async function (req, res) {
  const newsData = req.body;
  await uploadNews(newsData);
  res.status(StatusCodes.OK).json({ status: 'Success' });
};

type AddStocksHandler = ReqHandler<IAddStockRequestDto>;

export const addStock: AddStocksHandler = async function (req, res) {
  const stockData = req.body;
  await uploadStock(stockData);
  res.status(StatusCodes.OK).json({ status: 'Success' });
};

type AddStockUpdateDataHandler = ReqHandler<IAddStockUpdateDataDto>;

export const addStockUpdateData: AddStockUpdateDataHandler = async function (
  req,
  res,
) {
  const stockData = req.body;
  await uploadStockUpdate(stockData);
  res.status(StatusCodes.OK).json({ status: 'Success' });
};

type ControlEndpointHandler = ReqHandler<object>;

export const startGameHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  await gameService.initializeGame();
  setTimeout(startGame, 0);
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const startRoundHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const { roundNo, duration } = req.body as { roundNo?: number; duration?: number };
  
  // We don't use setTimeout(startRound, 0) anymore because startRound is async and we want to pass params
  // Also we want to handle errors if round determines it's invalid
  startRound(roundNo, duration); 

  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const extendRoundHandler: ControlEndpointHandler = async function(req, res) {
  const { minutes } = req.body as { minutes: number };
  if (!minutes || minutes <= 0) {
    res.status(StatusCodes.BAD_REQUEST).json({ status: 'Failure', message: 'Invalid duration' });
    return;
  }
  
  const success = extendActiveRound(minutes);
  if (success) {
    res.status(StatusCodes.OK).json({ status: 'Success' });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ status: 'Failure', message: 'No active round' });
  }
};

export const endRoundHandler: ControlEndpointHandler = async function(req, res) {
  await forceEndRound();
  res.status(StatusCodes.OK).json({ status: 'Success' });
};

export const createRoundConfigHandler: ControlEndpointHandler = async function(req, res) {
  const { roundNo, duration, message, rules, scheduledStartTime } = req.body as { 
    roundNo: number; 
    duration: number; 
    message?: string;
    rules?: any;
    scheduledStartTime?: string;
  };
  
  if (!roundNo || !duration) {
    res.status(StatusCodes.BAD_REQUEST).json({ status: 'Failure', message: 'Missing roundNo or duration' });
    return;
  }

  const data = {
    duration,
    description: message,
    rules: rules || {},
    scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null
  }

  const config = await prisma.roundConfig.upsert({
    where: { roundNo },
    update: data,
    create: { roundNo, ...data },
  });

  res.status(StatusCodes.OK).json({ status: 'Success', data: config });
};

export const getRoundConfigsHandler: ControlEndpointHandler = async function(req, res) {
  const configs = await prisma.roundConfig.findMany({
    orderBy: { roundNo: 'asc' }
  });
  res.status(StatusCodes.OK).json({ status: 'Success', data: configs });
};

export const terminateGameHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  await gameService.endRound(); // Ensure DB state is closed or handled
  setTimeout(terminateGame, 0);
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const flushDatabaseHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const { pass } = req.body as { pass: string };

  if (pass !== 'flush_db_bro') {
    res.status(StatusCodes.FORBIDDEN).json({
      status: 'Failure',
    });
    return;
  }
  await flushDatabase();
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const flushPlayerTableHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const { pass } = req.body as { pass: string };

  if (pass !== 'flush_player_table_bro') {
    res.status(StatusCodes.FORBIDDEN).json({
      status: 'Failure',
    });
    return;
  }
  await flushPlayerTable();
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const flushUserTableHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const { pass } = req.body as { pass: string };

  if (pass !== 'flush_user_table_bro') {
    res.status(StatusCodes.FORBIDDEN).json({
      status: 'Failure',
    });
    return;
  }

  await flushUserTable();
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const resetGameHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const { pass } = req.body as { pass: string };

  if (pass !== 'reset_game_bro') {
    res.status(StatusCodes.FORBIDDEN).json({
      status: 'Failure',
      message: 'Invalid password',
    });
    return;
  }
  
  await resetGameData();

  // Notify active clients to clear local state
  broadcastGameReset();

  res.status(StatusCodes.OK).json({
    status: 'Success',
    message: 'Game data reset successfully',
  });
};

export const getAdminPlayersHandler: ControlEndpointHandler = async function (
  req,
  res,
) {
  const users = await prisma.user.findMany({
    include: {
      account: {
        include: {
          portfolio: true,
        },
      },
    },
    where: {
      account: {
        isNot: null,
      },
    },
  });

  const result = users
    .filter((u) => u.account && u.account.portfolio)
    .map((u) => ({
      id: u.id,
      name: u.u1Name,
      email: u.email,
      bankBalance: u.account!.portfolio!.bankBalance,
      totalPortfolioValue: u.account!.portfolio!.totalPortfolioValue,
      stocks: u.account!.portfolio!.stocks,
    }));

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: result, // Original wrapped in data: result? No, `data: result`. Yes.
  });
};

type NotifyEndpointHandler = ReqHandler<INotifyRequestDto>;

export const sendNotificationHandler: NotifyEndpointHandler = async function (
  req,
  res,
) {
  const { message, type } = req.body;
  broadcastNotification(message, type || 'info');
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

export const getIPOEligibilityHandler: ReqHandler<object> = async function (req, res) {
  const { excludeSector } = req.query as { excludeSector?: string };
  const eligibleUsers = await getIPOEligibilityList(excludeSector);
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: eligibleUsers,
  });
};

export const allocateIPOHandler: ReqHandler<object> = async function (req, res) {
  const { allocations } = req.body as {
    allocations: { playerId: string; symbol: string; quantity: number; round: number }[];
  };
  
  if (!allocations || !Array.isArray(allocations)) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Invalid allocations data',
    });
    return;
  }

  const result = await allocateIPOStocks(allocations);
  broadcastNotification(`${allocations.length} IPO allocations created`, 'success');
  
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: result,
  });
};

export const getAvailableIPOStocksHandler: ReqHandler<object> = async function (req, res) {
  const stocks = await getAvailableIPOStocks();
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: stocks,
  });
};

export const removeIPOAllocationHandler: ReqHandler<object> = async function (req, res) {
  const { playerId, symbol, round } = req.body as {
    playerId: string;
    symbol: string;
    round: number;
  };
  
  if (!playerId || !symbol || !round) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Missing required fields: playerId, symbol, round',
    });
    return;
  }

  const removed = await removeIPOAllocation(playerId, symbol, round);
  
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: { removed },
  });
};

export const getAllIPOAllocationsHandler: ReqHandler<object> = async function (req, res) {
  const { round } = req.query as { round?: number };
  const allocations = await getAllIPOAllocations(round);
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: allocations,
  });
};

export const declareDividendHandler: ReqHandler<object> = async function (req, res) {
  const { symbol, amount, round } = req.body as {
    symbol: string;
    amount: number;
    round: number;
  };

  if (!symbol || amount === undefined || !round) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Missing required fields: symbol, amount, round',
    });
    return;
  }

  const stock = await prisma.stock.update({
    where: { symbol },
    data: { dividendAmount: amount },
  });

  await prisma.dividendDeclaration.upsert({
    where: {
      symbol_round: { symbol, round },
    },
    update: { amount, processed: false },
    create: {
      symbol,
      amount,
      round,
      processed: false,
    },
  });

  broadcastNotification(`Dividend declared: ${symbol} - Rs.${amount.toFixed(2)} per share`, 'success');

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: stock,
  });
};

export const updateUserBalanceHandler: ReqHandler<object> = async function (req, res) {
  const { playerId, amount, operation } = req.body as {
    playerId: string;
    amount: number;
    operation: 'SET' | 'ADD' | 'SUBTRACT';
  };

  if (!playerId || amount === undefined || !operation) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Missing required fields: playerId, amount, operation',
    });
    return;
  }

  const portfolio = await prisma.playerPortfolio.findUnique({
    where: { playerId },
  });

  if (!portfolio) {
    res.status(StatusCodes.NOT_FOUND).json({
      status: 'Failure',
      message: 'Portfolio not found',
    });
    return;
  }

  let newBalance: number;
  switch (operation) {
    case 'SET':
      newBalance = amount;
      break;
    case 'ADD':
      newBalance = portfolio.bankBalance + amount;
      break;
    case 'SUBTRACT':
      newBalance = portfolio.bankBalance - amount;
      break;
    default:
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'Failure',
        message: 'Invalid operation',
      });
      return;
  }

  if (newBalance < 0) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Balance cannot be negative',
    });
    return;
  }

  await prisma.playerPortfolio.update({
    where: { playerId },
    data: { bankBalance: newBalance },
  });

  broadcastNotification(`Balance updated for player: Rs.${newBalance.toFixed(2)}`, 'info');

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: { bankBalance: newBalance },
  });
};

export const generateNewsHandler: ReqHandler<object> = async function (req, res) {
  const { round, count } = req.body as {
    round?: number;
    count?: number;
  };

  const currentRound = round || 1;
  const newsCount = count || 5;

  const news = await generateAndStoreNews(currentRound, newsCount);
  broadcastStaggeredNews(news, 45000);
  broadcastNotification(`${newsCount} news items generated for Round ${currentRound}`, 'info');

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: news,
  });
};

export const getRoundSummaryHandler: ReqHandler<object> = async function (req, res) {
  const { round } = req.query as { round?: number };

  if (!round) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'Failure',
      message: 'Round number required',
    });
    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: { round },
    include: {
      stock: { select: { symbol: true, name: true, sector: true } },
    },
  });

  const stocks = await prisma.stock.findMany({
    select: { symbol: true, name: true, price: true },
  });

  const stockPrices = new Map(stocks.map(s => [s.symbol, s]));

  const volumeByStock: Record<string, { symbol: string; name: string; sector: string; volume: number; buyVolume: number; sellVolume: number }> = {};
  
  for (const tx of transactions) {
    const stockInfo = stockPrices.get(tx.stockSymbol);
    if (!volumeByStock[tx.stockSymbol]) {
      volumeByStock[tx.stockSymbol] = {
        symbol: tx.stockSymbol,
        name: stockInfo?.name || tx.stockSymbol,
        sector: tx.stock?.sector || 'Unknown',
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
      };
    }
    
    volumeByStock[tx.stockSymbol].volume += tx.quantity;
    if (tx.type === 'BUY') {
      volumeByStock[tx.stockSymbol].buyVolume += tx.quantity;
    } else {
      volumeByStock[tx.stockSymbol].sellVolume += tx.quantity;
    }
  }

  const volumeArray = Object.values(volumeByStock).sort((a, b) => b.volume - a.volume);

  const topGainers = volumeArray.slice(0, 3);
  const topLosers = volumeArray.slice(-3).reverse();

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: {
      round,
      totalTransactions: transactions.length,
      topGainers,
      topLosers,
      volumeByStock: volumeArray,
    },
  });
};
