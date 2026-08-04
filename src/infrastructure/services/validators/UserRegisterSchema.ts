import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address");

const passwordSchema = z.string()
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special symbol")
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must not exceed 20 characters");

export const userRegisterSchema = z.object({
    firstName: z.string().regex(/^[a-zA-Z]+$/, "Only letters allowed").min(3, "Min 3 characters").max(20, "Max 20 characters"),
    lastName: z.string().regex(/^[a-zA-Z]+$/, "Only letters allowed").min(1, "Min 1 character").max(20, "Max 20 characters"),
    email: emailSchema,
    password: passwordSchema,
});
