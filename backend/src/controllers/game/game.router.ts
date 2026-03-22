import { Router } from 'express';
import { blockGameRequest } from '../../middlewares/block-requests.middleware';
import { validatorFactory } from '../../middlewares/validator.middleware';
import { blockAdmin } from '../../middlewares/authorizer.middleware';
import { checkRoundActive } from '../../middlewares/gameStatus.middleware';
import { stockBuySellDtoSchema } from './game.controller.dto';
import { buyStockHandler, sellStockHandler } from './game.controller';
import { infoRouter } from './info/info.router';
import { powerupRouter } from './powerup/powerup.router';

export const gameRouter = Router();

// Info routes should be accessible to everyone who is logged in (Players & Admins)
// and likely even if the game round is not currently "OPEN" (viewing history/portfolio)
gameRouter.use('/info', infoRouter);

// Powerups are player-specific and game-affecting, so block admins
gameRouter.use('/powerup', blockAdmin, blockGameRequest, powerupRouter);

// Buying and Selling is core gameplay
// - Block Admins (they don't trade)
// - Check if round is active (DB check)
// - Block if game request logic says so (Memory check - blockGameRequest)
gameRouter.post(
  '/buy-stock',
  blockAdmin,
  blockGameRequest,
  checkRoundActive,
  validatorFactory(stockBuySellDtoSchema),
  buyStockHandler,
);
gameRouter.post(
  '/sell-stock',
  blockAdmin,
  blockGameRequest,
  checkRoundActive,
  validatorFactory(stockBuySellDtoSchema),
  sellStockHandler,
);
