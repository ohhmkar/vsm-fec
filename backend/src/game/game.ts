import type { Server } from 'socket.io';
import { IGameState } from '../types';
import EventEmitter from 'events';
import { logger } from '../services/index';
import {
  updatePlayerStatus,
  updatePlayerPortfolio,
  updateStocks,
} from '../game/helpers/sheduled-task';
import { maxGameRounds, roundDuration } from '../common/game.config';
import { gameService } from '../services/game.logic';

const gameEmitter = new EventEmitter();

const gameON = Symbol();
const gameOFF = Symbol();
const gameOPEN = Symbol();
const gameCLOSE = Symbol();
let timeoutId: NodeJS.Timeout;
let leaderboardInterval: NodeJS.Timeout;

const gameState: IGameState = {
  roundNo: 0,
  stage: 'INVALID',
};

export function getGameState() {
  return { ...gameState } as const;
}

export async function startGame() {
  try {
    // Sync DB game state
    await gameService.initializeGame();

    gameState.stage = 'ON';
    logger.info('Game is ON: Server Open to Login Requests');
  } catch (error) {
    logger.error('Failed to initialize database: ', error);
  }
  gameEmitter.emit(gameON);
}

export async function startRound() {
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

  // Sync DB game state — mark round as active so checkRoundActive middleware allows trades
  try {
    await gameService.startRound();
  } catch (error) {
    logger.error('Failed to sync DB round state:', error);
  }

  gameEmitter.emit(gameOPEN);

  import('../services/socket.service').then(({ broadcastLeaderboard, broadcastNews }) => {
    // Broadcast news slightly after round start
    setTimeout(() => broadcastNews(), 1000);
    
    // Broadcast leaderboard periodically throughout the active trading round
    leaderboardInterval = setInterval(() => {
      broadcastLeaderboard();
    }, 5000);
  });

  timeoutId = setTimeout(async () => {
    gameState.stage = 'CLOSE';
    gameEmitter.emit(gameCLOSE);
    clearInterval(leaderboardInterval);
    await endRound();
  }, roundDuration);
}

async function endRound() {
  logger.info('Game is CLOSED: Server Closed to Game Requests');

  // Sync DB game state — mark round as inactive
  try {
    await gameService.endRound();
  } catch (error) {
    logger.error('Failed to sync DB round end state:', error);
  }

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
    
    // Recursive loop to start next round
    await startRound();
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
  clearInterval(leaderboardInterval);
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
