import { z } from "zod";

export const searchStocksQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase().trim() : val),
      z.enum(["ALL", "EQUITY", "INDEX"])
    )
    .default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchStocksQuery = z.infer<typeof searchStocksQuerySchema>;

export const addToWatchlistSchema = z.object({
  stockId: z.string().uuid("Invalid stock ID format"),
});

export const removeFromWatchlistParamsSchema = z.object({
  stockId: z.string().uuid("Invalid stock ID format"),
});
