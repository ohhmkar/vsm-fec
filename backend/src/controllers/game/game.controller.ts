import type { ReqHandler } from '../../types';
import { ITradeDto } from './game.controller.dto';
import { BadRequest, UnprocessableEntity } from '../../errors/index';
import { StatusCodes } from 'http-status-codes';
import { buyStock, sellStock } from '../../game/game.handlers';
import { getGameState } from '../../game/game';

type TradeHandler = ReqHandler<ITradeDto>;

export const executeTradeHandler: TradeHandler = async function (req, res) {
  const { action, symbol, quantity } = req.body;
  if (!symbol || !quantity) {
    throw new BadRequest('Symbol or Quantity not Provided');
  }
  if (quantity <= 0) {
    throw new BadRequest('Quantity must be a positive number');
  }

  let result;
  if (action === 'BUY') {
    result = await buyStock(req.player.playerId, symbol, quantity, getGameState());
  } else if (action === 'SELL') {
    result = await sellStock(req.player.playerId, symbol, quantity, getGameState());
  } else {
    throw new UnprocessableEntity('Invalid action type');
  }

  res.status(StatusCodes.OK).json({
    status: 'Success',
    data: result,
  });
};
