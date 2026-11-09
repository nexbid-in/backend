import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { logger } from "../logging/logger";
import { env } from "../config/env";

const connectionString = env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ["warn"],
});

export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Prisma connected");
  } catch (error: unknown) {
    logger.error({ error }, "Prisma failed to connect to DB");
    throw error;
  }
}
