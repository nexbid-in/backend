import { z } from "zod";

export const UserRegisterSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(20, "Name must be less than 20 characters long"),

  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),

  dob: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "DOB must be in YYYY-MM-DD format"
    ),

  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});
