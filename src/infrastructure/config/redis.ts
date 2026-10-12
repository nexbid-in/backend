import IORedis from "ioredis";
import { logger } from "../logging/logger";
import { env } from "./env";

const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: true, 
});

export function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redis.status === "ready") {
      logger.info('Redis connected');
      return resolve();
    }
    
    redis.once("ready", () => {
      logger.info("Redis connected");
      resolve();
    });

    redis.once("error", (err: Error) => {
      logger.error({ err }, "Redis connection failed");
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
