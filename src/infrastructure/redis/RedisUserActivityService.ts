import { IUserActivityService } from "../../application/interface/services/IUserActivityService";
import { IUserRepository } from "../../domain/repositories/user/IUserRepository";
import redis from "../config/redis";
import { logger } from "../logging/logger";

export class RedisUserActivityService implements IUserActivityService {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _cooldownInSeconds: number = 300
  ) {}

  async recordActivity(userId: string): Promise<void> {
    try {
      const key = `user:last_active_cooldown:${userId}`;
      // Set key with TTL only if it does not already exist (NX)
      const result = await redis.set(key, "1", "EX", this._cooldownInSeconds, "NX");

      // "OK" indicates the key was newly set (first activity in this cooldown period)
      if (result === "OK") {
        await this._userRepo.updateLastActive(userId);
      }
    } catch (error) {
      // Non-blocking: log warning so unexpected Redis or DB issues don't impact request handling
      logger.warn({ err: error, userId }, "Failed to record user activity");
    }
  }
}
