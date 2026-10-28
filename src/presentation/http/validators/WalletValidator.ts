import { z } from "zod";
import { WalletTransactionType } from "../../../domain/entities/WalletTransaction";
import { PaymentStatus } from "../../../domain/entities/PaymentOrder";

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

export const createTopupOrderSchema = z.object({
  realAmount: z.coerce
    .number()
    .int("Amount must be a whole number")
    .min(10, "Minimum top-up is ₹10")
    .max(100000, "Maximum top-up is ₹1,00,000"),
});

export const verifyTopupPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
});

export const failTopupPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export type GetTopupHistoryQueryParams = {
  page: number;
  limit: number;
  status?: PaymentStatus | "ALL";
  search?: string;
  startDate?: Date;
  endDate?: Date;
};

export const getTopupHistoryQuerySchema: z.ZodType<GetTopupHistoryQueryParams> = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(["ALL", PaymentStatus.PENDING, PaymentStatus.SUCCESS, PaymentStatus.FAILED] as const)
    .optional(),
  search: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});


