import type { RequestHandler } from 'express';
import { NotFound } from '../errors/index';

export const notFoundHandler: RequestHandler = function (_req, _res) {
  throw new NotFound('Resource Not Found');
};
