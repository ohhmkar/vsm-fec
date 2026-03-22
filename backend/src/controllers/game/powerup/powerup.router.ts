import { Router } from 'express';
import { validatorFactory } from '../../../middlewares/validator.middleware';
import { stockBettingDtoSchema } from './powerup.controller.dto';
import {
  useInsiderTradingHander,
  useMuftKaPaisaHandler,
  useStockBettingHandler,
} from './powerup.controller';

export const powerupRouter = Router();

powerupRouter.post('/insider-trading', useInsiderTradingHander);
powerupRouter.post('/muft-ka-paisa', useMuftKaPaisaHandler);
powerupRouter.post(
  '/stock-betting',
  validatorFactory(stockBettingDtoSchema),
  useStockBettingHandler,
);
