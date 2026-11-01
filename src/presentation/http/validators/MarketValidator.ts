import { z } from "zod";

export const getHistoricalCandlesQuerySchema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required"),
  resolution: z.string().trim().default("15"),
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
});

export type GetHistoricalCandlesQuery = z.infer<typeof getHistoricalCandlesQuerySchema>;
