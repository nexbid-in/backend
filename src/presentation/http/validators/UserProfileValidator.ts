import { z } from "zod";
import { GetUserProfileRequestDTO } from "../../../application/dto/user/GetUserProfileDTO";

export const getUserProfileSchema: z.ZodType<GetUserProfileRequestDTO> = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const updateUserProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name cannot be empty").max(20, "First name cannot exceed 20 characters").optional(),
  lastName: z.string().trim().max(20, "Last name cannot exceed 20 characters").optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits")
    .nullable()
    .optional(),
  profileImage: z.string().url("Invalid image URL").nullable().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

const passwordSchema = z
  .string()
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special symbol")
  .min(8, "Password must be at least 8 characters")
  .max(20, "Password must not exceed 20 characters");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

