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
