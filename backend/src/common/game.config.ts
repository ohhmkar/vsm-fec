import { config } from 'dotenv';
config();

const envMaxRounds = Number(process.env.MAX_GAME_ROUNDS);
export const maxGameRounds = isNaN(envMaxRounds) ? 0 : envMaxRounds;

const envRoundDuration = Number(process.env.ROUND_DURATION);
export const roundDuration =
  (isNaN(envRoundDuration) ? 0 : envRoundDuration) * 60 * 1000;

const envInitialBankBalance = Number(process.env.INITIAL_BANK_BALANCE);
export const initialBankBalance = isNaN(envInitialBankBalance)
  ? 0
  : envInitialBankBalance;

const envMuftPaisa = Number(process.env.MUFT_KA_PAISA);
export const muftPaisa = isNaN(envMuftPaisa) ? 0 : envMuftPaisa;
