import { config } from 'dotenv';
config();

const envMaxRounds = Number(process.env.MAX_GAME_ROUNDS);
export const maxGameRounds = isNaN(envMaxRounds) ? 0 : envMaxRounds;

const envRoundDuration = Number(process.env.ROUND_DURATION);
export const roundDuration =
  (isNaN(envRoundDuration) ? 0 : envRoundDuration) * 60 * 1000;

const envInitialBankBalance = Number(process.env.INITIAL_BANK_BALANCE);
export const initialBankBalance = isNaN(envInitialBankBalance) || envInitialBankBalance === 0
  ? 10000000
  : envInitialBankBalance;

const envPriceImpact = Number(process.env.PRICE_IMPACT_MULTIPLIER);
export const priceImpactMultiplier = isNaN(envPriceImpact) ? 0.5 : envPriceImpact;

const envTotalSupply = Number(process.env.TOTAL_SUPPLY_PER_STOCK);
export const totalSupplyPerStock = isNaN(envTotalSupply) ? 1000 : envTotalSupply;

export const muftPaisa = 100000;
