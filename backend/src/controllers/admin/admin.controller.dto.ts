import { z } from 'zod';

export const addNewsRequestDtoSchema = z.array(
  z.object({
    content: z.string(),
    forInsider: z.boolean().default(false),
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

export const notifyRequestDtoSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
});

export type INotifyRequestDto = z.infer<typeof notifyRequestDtoSchema>;
