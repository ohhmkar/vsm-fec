import type { Server } from 'socket.io';
import { IGameState } from '../types';
import EventEmitter from 'events';
import { logger } from '../services/index';
import { flushPlayerTable } from './helpers/chore';
import {
  updatePlayerStatus,
  updatePlayerPortfolio,
  updateStocks,
} from '../game/helpers/sheduled-task';
import { maxGameRounds, roundDuration } from '../common/game.config';

const gameEmitter = new EventEmitter();

const gameON = Symbol();
const gameOFF = Symbol();
const gameOPEN = Symbol();
const gameCLOSE = Symbol();
let timeoutId: NodeJS.Timeout;

const gameState: IGameState = {
  roundNo: 0,
  stage: 'INVALID',
};

export function getGameState() {
  return { ...gameState } as const;
}

export async function startGame() {
  try {
    logger.info('Flushing Player Table');
    await flushPlayerTable();
    logger.info('Flushing Complete');

    gameState.stage = 'ON';
    logger.info('Game is ON: Server Open to Login Requests');
  } catch (error) {
    logger.error('Failed to initialize database: ', error);
  }
  gameEmitter.emit(gameON);
}

export function startRound() {
  const nextRound = gameState.roundNo + 1;
  if (nextRound === 1) {
    logger.info('Game is OPEN: Server Open to Game Requests');
  }
  if (nextRound > maxGameRounds) {
    logger.info('Max Game Rounds Reached');
    endGame();
    return;
  }

  gameState.roundNo = nextRound;
  gameState.stage = 'OPEN';
  logger.info(`Starting Round ${gameState.roundNo}...`);
  gameEmitter.emit(gameOPEN);

  timeoutId = setTimeout(async () => {
    gameState.stage = 'CLOSE';
    gameEmitter.emit(gameCLOSE);

    await endRound();
  }, roundDuration);
}

async function endRound() {
  logger.info('Game is CLOSED: Server Closed to Game Requests');
  try {
    logger.info('Updating Stocks...');
    await updateStocks(gameState);
    logger.info('Stocks Updated.');

    logger.info('Updating Player Portfolios...');
    await updatePlayerPortfolio(gameState);
    logger.info('Updated Player Portfolios.');

    logger.info('Updating Powercards...');
    await updatePlayerStatus();
    logger.info('Updated Player Powercard Status.');

    logger.info('Game Ready for Next Round');
  } catch (error) {
    logger.error('Failed to update: ', error);
  }
}

function endGame() {
  gameState.stage = 'OFF';
  gameEmitter.emit(gameOFF);
  logger.info('Game is OFF: Server Closed to all Player Requests');
}

export function terminateGame() {
  clearTimeout(timeoutId);
  gameState.stage = 'INVALID';
  gameState.roundNo = 0;
  gameEmitter.emit(gameOFF);
  logger.info('Forcefully Terminating Game');
}

export function registerGameGateway(io: Server) {
  gameEmitter.on(gameON, () => {
    io.emit('game:on');
  });
  gameEmitter.on(gameCLOSE, () => {
    io.emit('game:stage:CALCULATION_STAGE');
  });
  gameEmitter.on(gameOPEN, () => {
    io.emit('game:stage:TRADING_STAGE', new Date().getTime());
  });
  gameEmitter.on(gameOFF, () => {
    io.emit('game:end');
  });
}
