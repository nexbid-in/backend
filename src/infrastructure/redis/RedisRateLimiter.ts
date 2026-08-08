import { IRateLimiter } from "../../application/interface/services/IRateLimiter";
import redis from "../config/redis";

export class RedisRateLimiter implements IRateLimiter {
    async incrementAndCheck(key: string, limit: number, windowInSeconds: number): Promise<boolean> {
        const currentCount = await redis.incr(key);

        if (currentCount === 1) {
            await redis.expire(key, windowInSeconds);
        }

        return currentCount <= limit;
    }
}