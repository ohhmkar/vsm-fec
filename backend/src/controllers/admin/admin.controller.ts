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
  uploadNews,
  uploadStock,
  uploadStockUpdate,
} from '../../game/helpers/chore';
import { startGame, startRound, terminateGame } from '../../game/game';
import { gameService } from '../../services/game.logic';
import { broadcastNotification } from '../../services/socket.service';
import { prisma } from '../../services/prisma.service';

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
  await gameService.startRound();
  setTimeout(startRound, 0);
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
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
