import { z } from "zod";

export const getAdminStocksSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  query: z.string().optional(),
  type: z.enum(["ALL", "EQUITY", "INDEX"]).optional(),
  isActive: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  isTradable: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  sector: z.string().optional(),
});

export const createStockSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(30, "Symbol cannot exceed 30 characters")
    .trim()
    .toUpperCase(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  exchange: z
    .string()
    .min(1)
    .max(20)
    .trim()
    .toUpperCase()
    .default("NSE")
    .optional(),
  sector: z.string().max(100).trim().nullable().optional(),
  type: z.enum(["EQUITY", "INDEX"]).default("EQUITY"),
  feedSymbol: z.string().max(60).trim().toUpperCase().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
  isTradable: z.boolean().optional(),
});

export const updateStockStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isTradable: z.boolean().optional(),
});

export const updateStockSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  exchange: z.string().min(1).max(20).trim().toUpperCase().optional(),
  sector: z.string().max(100).trim().nullable().optional(),
  type: z.enum(["EQUITY", "INDEX"]).optional(),
  feedSymbol: z.string().max(60).trim().toUpperCase().nullable().optional(),
});

export const stockIdParamSchema = z.object({
  stockId: z.string().min(1, "Stock ID is required"),
});
