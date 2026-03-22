import { z } from 'zod';

export const tradeDtoSchema = z.object({
  action: z.enum(['BUY', 'SELL']),
  symbol: z.string(),
  quantity: z.coerce.number(),
});

export type ITradeDto = z.infer<typeof tradeDtoSchema>;
