import { Router } from 'express';
import { authorizeAdmin } from '../../middlewares/authorizer.middleware';
import { validatorFactory } from '../../middlewares/validator.middleware';
import {
  addNewsRequestDtoSchema,
  addStockRequestDtoSchema,
  addStockUpdateDataDtoSchema,
  notifyRequestDtoSchema,
} from './admin.controller.dto';
import {
  addNews,
  addStock,
  addStockUpdateData,
  startGameHandler,
  startRoundHandler,
  terminateGameHandler,
  createRoundConfigHandler,
  getRoundConfigsHandler,
  extendRoundHandler,
  endRoundHandler,
  getRoundSummaryHandler,
  pauseGameHandler,
  resumeGameHandler,
  getIPOEligibilityHandler,
  allocateIPOHandler,
  getAvailableIPOStocksHandler,
  removeIPOAllocationHandler,
  getAllIPOAllocationsHandler,
  declareDividendHandler,
  updateUserBalanceHandler,
  generateNewsHandler,
  flushDatabaseHandler,
  flushPlayerTableHandler,
  flushUserTableHandler,
  resetGameHandler,
  getAdminPlayersHandler,
  sendNotificationHandler,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authorizeAdmin);
adminRouter.post(
  '/add-news',
  validatorFactory(addNewsRequestDtoSchema),
  addNews,
);
adminRouter.post(
  '/add-stock',
  validatorFactory(addStockRequestDtoSchema),
  addStock,
);
adminRouter.post(
  '/add-stock-update',
  validatorFactory(addStockUpdateDataDtoSchema),
  addStockUpdateData,
);
adminRouter.post('/start-game', startGameHandler);
adminRouter.post('/start-round', startRoundHandler);
adminRouter.post('/terminate-game', terminateGameHandler);

// Round Management Endpoints
adminRouter.post('/rounds/config', createRoundConfigHandler);
adminRouter.get('/rounds/config', getRoundConfigsHandler);
adminRouter.post('/rounds/extend', extendRoundHandler);
adminRouter.post('/rounds/end-now', endRoundHandler);
adminRouter.post('/rounds/summary', getRoundSummaryHandler);
adminRouter.post('/game/pause', pauseGameHandler);
adminRouter.post('/game/resume', resumeGameHandler);

// IPO Endpoints
adminRouter.get('/ipo/eligibility', getIPOEligibilityHandler);
adminRouter.get('/ipo/stocks', getAvailableIPOStocksHandler);
adminRouter.post('/ipo/allocate', allocateIPOHandler);
adminRouter.delete('/ipo/allocation', removeIPOAllocationHandler);
adminRouter.get('/ipo/allocations', getAllIPOAllocationsHandler);

// Dividend Endpoints
adminRouter.post('/dividends/declare', declareDividendHandler);

// User Balance Endpoints
adminRouter.post('/users/balance', updateUserBalanceHandler);

// News Endpoints
adminRouter.post('/news/generate', generateNewsHandler);

adminRouter.post('/flush-database', flushDatabaseHandler);
adminRouter.post('/flush-player-table', flushPlayerTableHandler);
adminRouter.post('/flush-user-table', flushUserTableHandler);
adminRouter.post('/reset-game', resetGameHandler);
adminRouter.get('/players', getAdminPlayersHandler);
adminRouter.post('/notify', validatorFactory(notifyRequestDtoSchema), sendNotificationHandler);
