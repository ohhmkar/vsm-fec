import { Router } from 'express';
import {
  getGameInfoHandler,
  getNewsHandler,
  getStocksHandler,
  getLeaderboardHandler,
  getProfileHandler,
  getPortfolioHandler,
  getBalenceHandler,
} from './info.contorller';
// import { cacherFactory } from '../../../middlewares/cacher.middleware';
// import { cacheTime } from '../../../common/app.config';

export const infoRouter = Router();

// const cacher = cacherFactory(cacheTime);

infoRouter.get('/game-info', getGameInfoHandler);
infoRouter.get('/news', getNewsHandler);
infoRouter.get('/stocks', getStocksHandler);
infoRouter.get('/leaderboard', getLeaderboardHandler);
infoRouter.get('/profile', getProfileHandler);
infoRouter.get('/portfolio', getPortfolioHandler);
infoRouter.get('/balance', getBalenceHandler);
