import type { Request, Response, NextFunction } from 'express';
import { ServiceUnavailable } from '../errors/index';
import { getGameState } from '../game/game';

export function blockGameRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.url.endsWith('/leaderboard') && getGameState().stage === 'OFF') {
    next();
    return;
  }
  if (getGameState().stage !== 'OPEN') {
    throw new ServiceUnavailable(
      'Not Accepting Requests: Game is not in Trading Stage',
    );
  }
  next();
}

export function blockLoginRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    getGameState().stage === 'INVALID' ||
    getGameState().stage === 'OFF' ||
    getGameState().stage === 'CLOSE'
  ) {
    throw new ServiceUnavailable('Cannot Login right now.');
  }
  next();
}
