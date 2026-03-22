import { z } from 'zod';

export const stockBuySellDtoSchema = z.object({
  stock: z.string(),
  amount: z.coerce.number(),
});

export type IBuySellDto = z.infer<typeof stockBuySellDtoSchema>;
