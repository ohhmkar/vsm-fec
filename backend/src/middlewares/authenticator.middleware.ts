import type { Request, Response, NextFunction } from 'express';
import type { Socket } from 'socket.io';
import { verifyToken } from '../common/utils';
import { Unauthenticated } from '../errors/index';

export function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = (req.headers.authorization ?? '').split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.player = { playerId: payload.playerId, admin: payload.admin };

    next();
  } catch {
    throw new Unauthenticated('Invalid or Missing Token');
  }
}

export function authenticateSocketConnection(
  socket: Socket,
  next: (err?: Error & { data?: object }) => void,
) {
  const token = (socket.handshake.headers['authorization'] ?? '').split(' ')[1];
  try {
    verifyToken(token);

    next();
  } catch {
    next(new Error('Invalid or Missing Token'));
  }
}
