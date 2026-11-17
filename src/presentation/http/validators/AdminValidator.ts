import { z } from "zod";
import { GetUsersQueryDTO } from "../../../application/dto/admin/GetUsersDTO";
import { UpdateUserStatusDTO } from "../../../application/dto/admin/UpdateUserStatusDTO";
import {
  AdminCancelOrderDTO,
  AdminOrdersQueryDTO,
} from "../../../application/dto/admin/AdminOrderDTOs";

export const getUsersSchema: z.ZodType<GetUsersQueryDTO> = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(6),
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "BLOCKED"]).optional(),
});

export const updateUserStatusSchema: z.ZodType<UpdateUserStatusDTO> = z.object({
  userId: z.string().regex(/^X[A-Z]\d{5}$/, "Invalid user ID format"),
});

export const getAdminOrdersSchema: z.ZodType<AdminOrdersQueryDTO> = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["ALL", "PENDING", "EXECUTED", "CANCELLED", "REJECTED"]).optional(),
  side: z.enum(["ALL", "BUY", "SELL"]).optional(),
  productType: z.enum(["ALL", "CNC", "MIS"]).optional(),
  isAmo: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getAdminOrderDetailsSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
});

export const adminCancelOrderSchema: z.ZodType<AdminCancelOrderDTO> = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
});
