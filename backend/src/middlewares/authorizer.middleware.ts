import type { Request, Response, NextFunction } from 'express';
import { Unauthorized } from '../errors/index';

export function authorizeAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.player.admin) {
    throw new Unauthorized('Forbidden Endpoint: Only Admins Allowed');
  }
  next();
}

export function blockAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.player.admin) {
    throw new Unauthorized('Forbidden Endpoint: Only Players Allowed');
  }
  next();
}
