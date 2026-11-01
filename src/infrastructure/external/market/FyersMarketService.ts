import axios from "axios";
import redis from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../logging/logger";
import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketSymbolMapper } from "./MarketSymbolMapper";

interface FyersHistoryResponse {
  s: string;
  candles: [number, number, number, number, number, number][];
}

export class FyersMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];

  private async getAccessToken(): Promise<string> {
    const token = (await redis.get("market:fyers:access_token")) || env.FYERS_ACCESS_TOKEN;
    if (!token) {
      throw new Error("Active Fyers access token not found in Redis or .env");
    }
    return token;
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const cacheKey = `market:candles:${symbol}:${resolution}:${Math.floor(from / 60000)}:${Math.floor(to / 60000)}`;

    // 1. Check Redis Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Candle[];
    }

    const token = await this.getAccessToken();
    const fyersSymbol = MarketSymbolMapper.toFyersSymbol(symbol);

    // Map resolutions: "1", "5", "15", "60", "D"
    const fyersResolution = resolution === "1D" || resolution === "D" ? "D" : resolution;

    try {
      const response = await axios.get<FyersHistoryResponse>("https://api-t1.fyers.in/data/history", {
        headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${token}` },
        params: {
          symbol: fyersSymbol,
          resolution: fyersResolution,
          date_format: "0", // 0 = Epoch timestamp
          range_from: Math.floor(from / 1000),
          range_to: Math.floor(to / 1000),
        },
      });

      if (response.data.s !== "ok" || !response.data.candles) {
        logger.warn({ data: response.data, symbol }, "Fyers returned non-ok candle response");
        return [];
      }

      // Format: [ [epoch_sec, open, high, low, close, volume], ... ]
      const candles: Candle[] = response.data.candles.map((c) => ({
        timestamp: c[0] * 1000, // convert seconds to milliseconds
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));

      // Cache historical data (1 day for Daily candles, 5 min for Intraday)
      const ttl = resolution === "D" ? 86400 : 300;
      await redis.setex(cacheKey, ttl, JSON.stringify(candles));

      return candles;
    } catch (error) {
      logger.error({ error, symbol }, "Failed to fetch historical candles from Fyers");
      return [];
    }
  }

  async getQuote(_symbol: string): Promise<MarketTick | null> {
    return Promise.resolve(null);
  }

  async subscribe(_symbols: string[]): Promise<void> {
    return Promise.resolve();
  }

  async unsubscribe(_symbols: string[]): Promise<void> {
    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }
}