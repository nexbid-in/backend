import { z } from "zod";
import { GetUserProfileRequestDTO } from "../../../application/dto/user/GetUserProfileDTO";

export const getUserProfileSchema: z.ZodType<GetUserProfileRequestDTO> = z.object({
  userId: z.string().min(1, "User ID is required"),
});
