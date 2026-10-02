import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("7000").transform(Number),

    DATABASE_URL: z.string().url(),

    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string().default("6379").transform(Number),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("15m"),

    SMTP_HOST: z.string(),
    SMTP_PORT: z.string().transform(Number),
    SMTP_USER: z.string().email(),
    SMTP_PASS: z.string(),
    SMTP_FROM: z.string(),
});

// Validate the process.env against the schema
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:", parsedEnv.error.format());
    process.exit(1); // Crash the app early if variables are missing/wrong
}

export const env = parsedEnv.data;
