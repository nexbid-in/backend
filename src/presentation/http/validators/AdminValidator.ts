import { z } from "zod";
import { GetUsersQueryDTO } from "../../../application/dto/admin/GetUsersDTO";
import { UpdateUserStatusDTO } from "../../../application/dto/admin/UpdateUserStatusDTO";

export const getUsersSchema: z.ZodType<GetUsersQueryDTO> = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(6),
  search: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "BLOCKED"]).optional(),
});

export const updateUserStatusSchema: z.ZodType<UpdateUserStatusDTO> = z.object({
  userId: z.string().regex(/^X[A-Z]\d{5}$/, "Invalid user ID format"),
});