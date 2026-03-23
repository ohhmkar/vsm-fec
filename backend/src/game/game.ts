import type { Server } from 'socket.io';
import { IGameState } from '../types';
import EventEmitter from 'events';
import { logger } from '../services/index';
import {
  updatePlayerStatus,
  updatePlayerPortfolio,
  updateStocks,
  processDividends,
  clearPlayerRoundData,
  unlockIPOShares,
} from '../game/helpers/sheduled-task';
import { maxGameRounds, roundDuration } from '../common/game.config';
import { marketGameSimulator } from '../services/market-simulation.service';
import { prisma } from '../services/prisma.service';
import { gameService } from '../services/game.logic';
import { generateAndStoreNews } from '../services/news-generator.service';
import { broadcastStaggeredNews } from '../services/socket.service';

const gameEmitter = new EventEmitter();

const gameON = Symbol();
const gameOFF = Symbol();
const gameOPEN = Symbol();
const gameCLOSE = Symbol();
let timeoutId: NodeJS.Timeout | undefined;
let leaderboardInterval: NodeJS.Timeout | undefined;
let schedulerInterval: NodeJS.Timeout | undefined;

const gameState: IGameState = {
  roundNo: 0,
  stage: 'INVALID',
  isPaused: false,
};
// Add tracking for active round timing
let roundEndTime: number | null = null;
let pausedRemainingTime: number | null = null;


export function getGameState() {
  return { ...gameState } as const;
}

export async function startGame() {
  try {
    // Sync DB game state
    await gameService.initializeGame();

    gameState.stage = 'ON';
    logger.info('Game is ON: Server Open to Login Requests');
    
    // Start Scheduler for auto-round starts
    startScheduler();

  } catch (error) {
    logger.error('Failed to initialize database: ', error);
  }
  gameEmitter.emit(gameON);
}

export async function startRound(roundNumber?: number, durationMinutes?: number) {
  const nextRound = roundNumber ?? (gameState.roundNo + 1);
  if (nextRound > maxGameRounds) {
    logger.info('Max Game Rounds Reached');
    endGame();
    return;
  }

  // Determine Duration & Rules: Priority -> Manual Override > DB Config > Default Config
  let currentDurationMs = roundDuration; // Default env value (in ms)
  
  // Try to fetch DB config
  try {
    const config = await prisma.roundConfig.findUnique({ where: { roundNo: nextRound } });
    if (config) {
      currentDurationMs = config.duration * 60 * 1000;
      
      // Load Rules
      if (config.rules && typeof config.rules === 'object') {
        gameState.activeRules = config.rules as any;
        logger.info(`Loaded rules for Round ${nextRound}: ${JSON.stringify(gameState.activeRules)}`);
      }
    }
  } catch (err) {
    logger.warn(`Could not fetch round config for round ${nextRound}`, err);
  }

  // Manual Override
  if (durationMinutes) {
    currentDurationMs = durationMinutes * 60 * 1000;
  }

  gameState.roundNo = nextRound;
  gameState.stage = 'OPEN';
  gameState.isPaused = false;
  gameState.pausedAt = undefined;
  pausedRemainingTime = null;
  
  roundEndTime = Date.now() + currentDurationMs;
  
  logger.info(`Starting Round ${gameState.roundNo} for ${currentDurationMs / 60000} minutes...`);

  // Sync DB game state — mark round as active so checkRoundActive middleware allows trades
  try {
    await gameService.startRound();
  } catch (error) {
    logger.error('Failed to sync DB round state:', error);
  }

  gameEmitter.emit(gameOPEN);

  // Generate and broadcast staggered news
  const newsIntervalMs = 45000; // 45 seconds between news items
  const generatedNews = await generateAndStoreNews(nextRound, 5);
  broadcastStaggeredNews(generatedNews, newsIntervalMs);

  import('../services/socket.service').then(({ broadcastLeaderboard, broadcastNews }) => {
    // Broadcast news slightly after round start
    setTimeout(() => broadcastNews(), 1000);
    
    // Broadcast leaderboard periodically throughout the active trading round
    leaderboardInterval = setInterval(() => {
      broadcastLeaderboard();
    }, 5000);
  });

  // Start market simulation (live price ticks)
  marketGameSimulator.start();

  // Clear any existing timeout
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(async () => {
    // Round ends automatically
    await endRound();
  }, currentDurationMs);
}

/**
 * Extend the current active round
 * @param minutes Minutes to add
 */
export function extendActiveRound(minutes: number) {
  if (gameState.stage !== 'OPEN' || !roundEndTime) {
    logger.warn('Cannot extend round: No active round.');
    return false;
  }

  const additionalMs = minutes * 60 * 1000;
  roundEndTime += additionalMs;
  const remainingTime = roundEndTime - Date.now();

  // Reset timeout with new remaining time
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    await endRound();
  }, remainingTime);

  logger.info(`Round ${gameState.roundNo} extended by ${minutes} minutes. Ends in ${(remainingTime/60000).toFixed(1)} mins.`);
  return true;
}

/**
 * Force end the current active round immediately
 */
export async function forceEndRound() {
  if (gameState.stage !== 'OPEN') {
    logger.warn('Cannot force end round: No active round.');
    return;
  }
  logger.info(`Force ending Round ${gameState.roundNo}...`);
  if (timeoutId) clearTimeout(timeoutId);
  await endRound();
}

async function endRound() {
  logger.info('Game is CLOSED: Server Closed to Game Requests');
  
  gameState.stage = 'CLOSE';
  gameState.isPaused = false;
  roundEndTime = null;
  pausedRemainingTime = null;
  gameEmitter.emit(gameCLOSE);
  
  clearInterval(leaderboardInterval);
  
  // Stop market simulation
  marketGameSimulator.stop();

  // Sync DB game state — mark round as inactive
  try {
    await gameService.endRound();
  } catch (error) {
    logger.error('Failed to sync DB round end state:', error);
  }

  try {
    logger.info('Processing Dividends...');
    await processDividends(gameState);
    logger.info('Dividends Processed.');
  } catch (error) {
    logger.error('Failed to process dividends:', error);
  }

  try {
    logger.info('Updating Stocks...');
    await updateStocks(gameState);
    logger.info('Stocks Updated.');
  } catch (error) {
    logger.error('Failed to update stocks:', error);
  }
  // The Admin must manually trigger the next round.

  logger.info('Updating Player Portfolios...');
  await updatePlayerPortfolio(gameState);
  logger.info('Updated Player Portfolios.');

  logger.info('Updating Powercards...');
  await updatePlayerStatus();
  logger.info('Updated Player Powercard Status.');

  logger.info('Clearing Player Round Data...');
  await clearPlayerRoundData();
  await unlockIPOShares(gameState);
  logger.info('Player Round Data Cleared.');

  logger.info('Game Ready for Next Round');
}

// --- Game Control Utilities ---

export function pauseGame() {
  if (gameState.stage === 'OPEN' && !gameState.isPaused) {
    // Calculate remaining time
    if (roundEndTime) {
      pausedRemainingTime = roundEndTime - Date.now();
    } else {
        pausedRemainingTime = 0;
    }

    // Clear timers
    if (timeoutId) clearTimeout(timeoutId);
    if (leaderboardInterval) clearInterval(leaderboardInterval);
    
    // Stop market simulation
    marketGameSimulator.stop();
    
    gameState.isPaused = true;
    gameState.pausedAt = Date.now();
    gameState.pauseRemainingTime = pausedRemainingTime;
    
    import('../services/socket.service').then(({ getIO }) => {
        getIO().emit('game:paused', { remainingMs: pausedRemainingTime });
    });

    logger.info(`Game PAUSED. Remaining time: ${(pausedRemainingTime || 0) / 1000}s`);
    return true;
  }
  return false;
}

export function resumeGame() {
  if (gameState.isPaused && pausedRemainingTime !== null) {
      // Restart market simulation
      marketGameSimulator.start();

      // New end time
      roundEndTime = Date.now() + pausedRemainingTime;
      
      // Restart round end timer
      timeoutId = setTimeout(async () => {
        await endRound();
      }, pausedRemainingTime);

      // Restart leaderboard broadcast
      import('../services/socket.service').then(({ broadcastLeaderboard, getIO }) => {
        leaderboardInterval = setInterval(() => {
            broadcastLeaderboard();
        }, 5000);
          
        getIO().emit('game:resumed', { endTime: roundEndTime });
      });

      gameState.isPaused = false;
      gameState.pausedAt = undefined;
      // pausedRemainingTime = null; // keep for ref if needed, but logic uses isPaused

      logger.info('Game RESUMED');
      return true;
  }
  return false;
}

// --- Scheduler ---

async function startScheduler() {
  if (schedulerInterval) return;
  
  logger.info('Starting Auto-Scheduler...');
  schedulerInterval = setInterval(async () => {
    // Only verify schedules if we are NOT in an active round
    if (gameState.stage !== 'ON' && gameState.stage !== 'CLOSE') return;

    try {
      const nextRound = gameState.roundNo + 1;
      const config = await prisma.roundConfig.findUnique({ where: { roundNo: nextRound } });
      
      if (config && config.scheduledStartTime) {
        const now = new Date();
        const startTime = new Date(config.scheduledStartTime);
        const diff = now.getTime() - startTime.getTime();
        
        // If passed scheduled time within last minute, start it.
        if (diff >= 0 && diff < 60000) { 
             logger.info(`Auto-starting Scheduled Round ${nextRound}...`);
             await startRound(nextRound);
        }
      }
    } catch (e) {
      logger.error('Scheduler error', e); 
    }
  }, 10000); // Check every 10 seconds
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
