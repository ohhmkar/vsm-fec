import { NextFunction, Response, Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { gameService } from '../services/game.logic';
import { ServiceUnavailable } from '../errors/index';

export const checkRoundActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAllowed = await gameService.isTradingAllowed();
    if (!isAllowed) {
      throw new ServiceUnavailable('Trading is currently closed. Please wait for the next round.');
    }
    next();
  } catch (error) {
    next(error);
  }
};
