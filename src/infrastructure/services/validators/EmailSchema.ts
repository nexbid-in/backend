import { z } from "zod";

export const EmailSchema = z.object({
    email: z.string().email({ message: "Invalid email address"}).trim(),
});