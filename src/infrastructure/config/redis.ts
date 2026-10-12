import IORedis from "ioredis";
import { logger } from "../logging/logger";
import { env } from "./env";

const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Attach a listener to prevent EventEmitter unhandled error event crashes
redis.on("error", (err: Error) => {
  if (redis.status !== "connecting") {
    logger.error({ err }, "Redis error");
  }
});

export async function connectRedis(): Promise<void> {
  if (redis.status === "ready") {
    logger.info("Redis connected");
    return;
  }

  try {
    await redis.connect();
    logger.info("Redis connected");
  } catch (err: unknown) {
    logger.error({ err }, "Redis connection failed");
    throw err;
  }
}

process.on("SIGINT", async () => {
  logger.info("Closing redis");
  await redis.quit();
  process.exit(0);
});

export default redis;
