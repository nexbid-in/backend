import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { logger } from "../logging/logger";

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({
  adapter,
  log: ["info", "warn", "error"], 
});

export async function connectPrisma() {
  try {
    await prisma.$connect();
    logger.info("Prisma connected");
  } catch (error: unknown) {
    logger.error({ error }, "Prisma failed to connect to DB");
    process.exit(1); 
  }
}
