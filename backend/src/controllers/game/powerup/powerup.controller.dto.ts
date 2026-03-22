import { z } from 'zod';

export const stockBettingDtoSchema = z.object({
  stockBettingAmount: z.coerce.number(),
  stockBettingPrediction: z.enum(['UP', 'DOWN']),
  stockBettingLockedSymbol: z.string(),
});

export type IStockBettingDto = z.infer<typeof stockBettingDtoSchema>;
