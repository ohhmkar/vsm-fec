import type { ReqHandler } from '../../../types';
import { StatusCodes } from 'http-status-codes';
import {
  getLeaderboard,
  getNews,
  getPlayerProfile,
  getPlayerPortfolio,
  getStocks,
  getPlayerBalence,
} from '../../../game/game.handlers';
import { getGameState } from '../../../game/game';

type InfoEndpointHandler = ReqHandler<object>;

export const getNewsHandler: InfoEndpointHandler = async function (req, res) {
  const newsData = await getNews(getGameState());
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: newsData,
  });
};

export const getStocksHandler: InfoEndpointHandler = async function (req, res) {
  const stocksData = await getStocks(getGameState());
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: stocksData,
  });
};

export const getLeaderboardHandler: InfoEndpointHandler = async function (
  req,
  res,
) {
  const leaderboard = await getLeaderboard();
  res.status(StatusCodes.OK).json({ status: 'Success', data: leaderboard });
};

export const getGameInfoHandler: InfoEndpointHandler = function (req, res) {
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: { ...getGameState() },
  });
};

export const getProfileHandler: InfoEndpointHandler = async function (
  req,
  res,
) {
  const playerProfile = await getPlayerProfile(req.player.playerId);
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: playerProfile,
  });
};

export const getPortfolioHandler: InfoEndpointHandler = async function (
  req,
  res,
) {
  const playerData = await getPlayerPortfolio(req.player.playerId);

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: playerData,
  });
};

export const getBalenceHandler: InfoEndpointHandler = async function (
  req,
  res,
) {
  const playerData = await getPlayerBalence(req.player.playerId);
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: playerData,
  });
};
