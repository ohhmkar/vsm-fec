import { Router } from 'express';
import { blockGameRequest } from '../../middlewares/block-requests.middleware';
import { validatorFactory } from '../../middlewares/validator.middleware';
import { blockAdmin } from '../../middlewares/authorizer.middleware';
import { stockBuySellDtoSchema } from './game.controller.dto';
import { buyStockHandler, sellStockHandler } from './game.controller';
import { infoRouter } from './info/info.router';
import { powerupRouter } from './powerup/powerup.router';

export const gameRouter = Router();

gameRouter.use(blockAdmin, blockGameRequest);

gameRouter.use('/info', infoRouter);
gameRouter.use('/powerup', powerupRouter);
gameRouter.post(
  '/buy-stock',
  validatorFactory(stockBuySellDtoSchema),
  buyStockHandler,
);
gameRouter.post(
  '/sell-stock',
  validatorFactory(stockBuySellDtoSchema),
  sellStockHandler,
);
