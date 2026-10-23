import { z } from "zod";
import { WalletTransactionType } from "../../../domain/entities/WalletTransaction";

export type GetWalletStatementQueryParams = {
  page: number;
  limit: number;
  search?: string;
  type?: WalletTransactionType | "ALL";
  startDate?: Date;
  endDate?: Date;
};

export const getWalletStatementQuerySchema: z.ZodType<GetWalletStatementQueryParams> = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  type: z.enum(["ALL", "TOPUP", "BUY", "SELL", "BONUS"] as const).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
