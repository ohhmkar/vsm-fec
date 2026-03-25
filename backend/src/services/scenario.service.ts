import { prisma } from '../services/prisma.service';
import { logger } from '../services/logging.service';
import { applyTradeImpact } from '../services/realtime-price.service';
import { broadcastStockUpdate } from '../services/socket.service';

interface ScenarioChange {
  symbol: string;
  targetPercent: number;
}

interface ScenarioConfig {
  round: number;
  changes: ScenarioChange[];
}

const SCENARIO_CONFIG: ScenarioConfig[] = [
  {
    round: 1,
    changes: [
      { symbol: 'PETR', targetPercent: 18 },
      { symbol: 'INFR', targetPercent: 3 },
      { symbol: 'VOLT', targetPercent: -7},
      { symbol: 'TITA', targetPercent: 5 },
    ],
  },
  {
    round: 2,
    changes: [
      { symbol: 'PETR', targetPercent: 4 },
      { symbol: 'URBC', targetPercent: -6 },
      { symbol: 'FIBR', targetPercent: 10 },
      { symbol: 'AGRI', targetPercent: -9 },
      { symbol: 'GRNF', targetPercent: -8 },
    ],
  },
  {
    round: 3,
    changes: [
      { symbol: 'CRED', targetPercent: -20 },
      { symbol: 'TRSP', targetPercent: -2 },
      { symbol: 'SCRT', targetPercent: 4 },
      { symbol: 'FINV', targetPercent: -4 },
    ],
  },
  {
    round: 4,
    changes: [
      { symbol: 'BLUE', targetPercent: -11 },
      { symbol: 'NEXT', targetPercent: 5 },
      { symbol: 'FINV', targetPercent: -3 },
    ],
  },
  {
    round: 5,
    changes: [
      { symbol: 'GRID', targetPercent: -16 },
      { symbol: 'VOLT', targetPercent: 4 },
      { symbol: 'TRSP', targetPercent: -4},
    ],
  },
  {
    round: 6,
    changes: [
      { symbol: 'PETR', targetPercent: -3 },
      { symbol: 'INFR', targetPercent: -8 },
      { symbol: 'TITA', targetPercent: -3 },
      { symbol: 'FIBR', targetPercent: 3},
    ],
  },
  {
    round: 7,
    changes: [
      { symbol: 'AGRI', targetPercent: -2 },
      { symbol: 'AURU', targetPercent: 7 },
      { symbol: 'SCRT', targetPercent: 3 },

    ],
  },
  {
    round: 8,
    changes: [
      { symbol: 'TRSP', targetPercent: 4 },
      { symbol: 'URBC', targetPercent: 3 },
      { symbol: 'NEXT', targetPercent: 6 },
    ],
  },
  {
    round: 9,
    changes: [
      { symbol: 'SCRT', targetPercent: 12 },
      { symbol: 'VOLT', targetPercent: 6 },
    ],
  },
  {
    round: 10,
    changes: [
      { symbol: 'AGRI', targetPercent: 2 },
      { symbol: 'MEDC', targetPercent: 14 },
      { symbol: 'NEXT', targetPercent: 18 },
      { symbol: 'HELX', targetPercent: 4 },
      { symbol: 'SCRT', targetPercent: 7 },
    ],
  },
];

let scenarioInterval: NodeJS.Timeout | null = null;

export async function executeScenario(roundNumber: number): Promise<void> {
  const scenario = SCENARIO_CONFIG.find(s => s.round === roundNumber);
  
  if (!scenario) {
    logger.info(`No scenario configured for round ${roundNumber}`);
    return;
  }

  logger.info(`Executing scenario for round ${roundNumber}: ${JSON.stringify(scenario.changes)}`);

  const durationMs = 90000;
  const steps = 30;
  const stepInterval = durationMs / steps;

  for (const change of scenario.changes) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: change.symbol },
      select: { price: true, name: true },
    });

    if (!stock) {
      logger.warn(`Stock ${change.symbol} not found for scenario`);
      continue;
    }

    const currentPrice = stock.price;
    const targetPrice = currentPrice * (1 + change.targetPercent / 100);
    const pricePerStep = (targetPrice - currentPrice) / steps;
    
    logger.info(`Scenario: ${stock.name} (${change.symbol}) from $${currentPrice.toFixed(2)} to $${targetPrice.toFixed(2)} (${change.targetPercent}%)`);
  }

  let step = 0;
  
  const executeStep = async () => {
    step++;
    
    for (const change of scenario.changes) {
      const stock = await prisma.stock.findUnique({
        where: { symbol: change.symbol },
        select: { price: true, name: true },
      });

      if (!stock) continue;

      const currentPrice = stock.price;
      const targetPrice = currentPrice * (1 + change.targetPercent / 100);
      const pricePerStep = (targetPrice - currentPrice) / steps;
      
      const stepPrice = Math.max(0.01, currentPrice + pricePerStep);
      
      await prisma.stock.update({
        where: { symbol: change.symbol },
        data: { price: Math.round(stepPrice * 100) / 100 },
      });

      broadcastStockUpdate(change.symbol, stepPrice, currentPrice, 'SELL', 500);
    }

    if (step >= steps) {
      logger.info(`Scenario for round ${roundNumber} completed`);
      if (scenarioInterval) {
        clearInterval(scenarioInterval);
        scenarioInterval = null;
      }
    }
  };

  scenarioInterval = setInterval(executeStep, stepInterval);
  await executeStep();
}

export function stopScenario(): void {
  if (scenarioInterval) {
    clearInterval(scenarioInterval);
    scenarioInterval = null;
  }
}

export function getScenarioForRound(roundNumber: number): ScenarioChange[] | null {
  const scenario = SCENARIO_CONFIG.find(s => s.round === roundNumber);
  return scenario?.changes ?? null;
}
