import { z } from 'zod';

export const addNewsRequestDtoSchema = z.array(
  z.object({
    content: z.string(),
    forInsider: z.boolean(),
    roundApplicable: z.coerce.number(),
  }),
);

export type IAddNewsRequestDto = z.infer<typeof addNewsRequestDtoSchema>;

export const addStockRequestDtoSchema = z.array(
  z.object({
    symbol: z.string(),
    volatility: z.coerce.number(),
    price: z.coerce.number(),
    roundIntorduced: z.coerce.number(),
  }),
);

export type IAddStockRequestDto = z.infer<typeof addStockRequestDtoSchema>;

export const addStockUpdateDataDtoSchema = z.array(
  z.object({
    symbol: z.string(),
    forRound: z.coerce.number(),
    volatility: z.coerce.number(),
  }),
);

export type IAddStockUpdateDataDto = z.infer<
  typeof addStockUpdateDataDtoSchema
>;
