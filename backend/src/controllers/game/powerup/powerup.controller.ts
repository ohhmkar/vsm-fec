import { StatusCodes } from 'http-status-codes';
import { getGameState } from '../../../game/game';
import {
  useInsiderTrading,
  useMuftKaPaisa,
  useStockBetting,
} from '../../../game/game.handlers';
import type { ReqHandler } from '../../../types';
import { IStockBettingDto } from './powerup.controller.dto';

type PowerupHandler = ReqHandler<object>;

export const useInsiderTradingHander: PowerupHandler = async function (
  req,
  res,
) {
  const insiderNewsData = await useInsiderTrading(
    req.player.playerId,
    getGameState(),
  );
  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: insiderNewsData,
  });
};

export const useMuftKaPaisaHandler: PowerupHandler = async function (req, res) {
  await useMuftKaPaisa(req.player.playerId);
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};

type StockBettingHandler = ReqHandler<IStockBettingDto>;

export const useStockBettingHandler: StockBettingHandler = async function (
  req,
  res,
) {
  const {
    stockBettingAmount,
    stockBettingPrediction,
    stockBettingLockedSymbol,
  } = req.body;
  await useStockBetting(
    req.player.playerId,
    stockBettingAmount,
    stockBettingPrediction,
    stockBettingLockedSymbol,
  );
  res.status(StatusCodes.OK).json({
    status: 'Success',
  });
};
