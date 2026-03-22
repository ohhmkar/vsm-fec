import { Router } from 'express';
import {
  getGameInfoHandler,
  getNewsHandler,
  getStocksHandler,
  getLeaderboardHandler,
  getPortfolioHandler,
} from './info.contorller';
import { cacherFactory } from '../../../middlewares/cacher.middleware';
import { cacheTime } from '../../../common/app.config';

export const infoRouter = Router();

const cacher = cacherFactory(cacheTime as number);

infoRouter.get('/game-info', getGameInfoHandler);
infoRouter.get('/news', getNewsHandler);
infoRouter.get('/stocks', getStocksHandler);
infoRouter.get('/leaderboard', cacher, getLeaderboardHandler);
infoRouter.get('/portfolio', getPortfolioHandler);
