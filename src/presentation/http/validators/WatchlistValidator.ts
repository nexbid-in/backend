import { z } from "zod";

export const searchStocksQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query cannot be empty"),
  limit: z.coerce.number().int().min(1).max(50).default(15).optional(),
});

export const addToWatchlistSchema = z.object({
  stockId: z.string().uuid("Invalid stock ID format"),
});

export const removeFromWatchlistParamsSchema = z.object({
  stockId: z.string().uuid("Invalid stock ID format"),
});
