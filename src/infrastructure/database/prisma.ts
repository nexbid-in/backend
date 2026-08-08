import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { logger } from "../logging/logger";

const connectionString = process.env.DATABASE_URL!;

// 1. Create a PostgreSQL connection pool
const pool = new Pool({ connectionString });

// 2. Pass the pool to the Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ["info", "warn", "error"], 
});

export async function connectPrisma() {
  try {
    // 3. Connect and verify with a simple query to ensure the DB is reachable
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Prisma connected");
  } catch (error: unknown) {
    logger.error({ error }, "Prisma failed to connect to DB");
    process.exit(1); 
  }
}
