import IORedis from "ioredis";
import { logger } from "../logging/logger";

const redis = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: true, 
});

export function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    redis.once("ready", () => {
      logger.info("Redis connected");
      resolve();
    });

    redis.once("error", (err: any) => {
      logger.error("Redis connection failed", err);
      reject(err);
    });
  });
}

process.on("SIGINT", async () => {
  logger.info("Closing redis");
  await redis.quit();
  process.exit(0);
});

export default redis;
