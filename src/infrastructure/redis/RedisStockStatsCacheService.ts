import { IStockStatsCacheService } from "../../application/interface/services/IStockStatsCacheService";
import { StockOverviewStats } from "../../domain/services/market/StockPerformanceCalculator";
import redis from "../config/redis";
import { logger } from "../logging/logger";

/**
 * Redis-backed implementation of daily stock overview statistics caching.
 */
export class RedisStockStatsCacheService implements IStockStatsCacheService {
  private static readonly CACHE_TTL_SECONDS = 43200;

  private buildKey(symbol: string, dateKey: string): string {
    return `market:stats:overview:v2:${symbol}:${dateKey}`;
  }

  async getOverviewStats(
    symbol: string,
    dateKey: string
  ): Promise<StockOverviewStats | null> {
    const cacheKey = this.buildKey(symbol, dateKey);

    try {
      const cached = await redis.get(cacheKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as Partial<StockOverviewStats>;
      if (!parsed.range52W || !parsed.anchors) {
        return null;
      }

      return {
        range52W: parsed.range52W,
        anchors: parsed.anchors,
        fallbackClose: parsed.fallbackClose ?? null,
      };
    } catch (cacheErr) {
      logger.warn(
        { symbol, cacheErr },
        "Failed to read overview stats cache from Redis"
      );
      return null;
    }
  }

  async setOverviewStats(
    symbol: string,
    dateKey: string,
    stats: StockOverviewStats
  ): Promise<void> {
    const cacheKey = this.buildKey(symbol, dateKey);

    try {
      await redis.set(
        cacheKey,
        JSON.stringify(stats),
        "EX",
        RedisStockStatsCacheService.CACHE_TTL_SECONDS
      );
    } catch (cacheErr) {
      logger.warn(
        { symbol, cacheErr },
        "Failed to write overview stats cache to Redis"
      );
    }
  }
}
