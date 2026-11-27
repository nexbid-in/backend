import axios from "axios";
import { IBrokerAuthService } from "../../../../application/interface/services/IBrokerAuthService";
import { ILogger } from "../../../../application/interface/services/ILogger";
import { IHistoricalMarketDataReader } from "../../../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../../../application/interface/services/IMarketSymbolRegistry";
import { Candle } from "../../../../domain/entities/market/Candle";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { env } from "../../../config/env";
import redis from "../../../config/redis";
import { MarketTickCache } from "../MarketTickCache";

interface FyersHistoryResponse {
  s: string;
  candles: [number, number, number, number, number, number][];
}

interface CandleChunkRange {
  from: number;
  to: number;
}

/**
 * Fetches, chunks, caches (with stale fallback), and normalizes historical OHLCV candles from Fyers.
 */
export class FyersHistoricalCandleClient implements IHistoricalMarketDataReader {
  constructor(
    private readonly brokerAuthService: IBrokerAuthService,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    private readonly tickCache: MarketTickCache,
    private readonly logger: ILogger
  ) {}

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const cacheKey = `market:candles:${symbol}:${resolution}:${Math.floor(from / 60000)}:${Math.floor(to / 60000)}`;
    const staleCacheKey = `market:candles:stale:${symbol}:${resolution}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Candle[];
    }

    const token = await this.resolveAccessTokenOrServeStale(
      symbol,
      resolution,
      staleCacheKey
    );
    if (Array.isArray(token)) {
      return token;
    }

    const fyersSymbol = this.symbolRegistry.toFeedSymbol(symbol);
    const fyersResolution =
      resolution === "1D" || resolution === "D" ? "D" : resolution;
    const isEOD = ["D", "W", "M", "1D", "1W", "1M"].includes(fyersResolution);

    const chunks = this.buildChunkRanges(fyersResolution, isEOD, from, to);
    if (chunks.length === 0) {
      return [];
    }

    try {
      const chunkResults = await this.fetchChunksWithRetry(
        token,
        symbol,
        fyersSymbol,
        fyersResolution,
        chunks
      );

      const flatCandles = chunkResults.flat();
      if (flatCandles.length === 0) {
        return this.serveStaleOrEmpty(staleCacheKey, symbol, resolution);
      }

      const candles = this.normalizeAndSortCandles(flatCandles);
      const ttl = isEOD ? 86400 : 300;
      await redis.setex(cacheKey, ttl, JSON.stringify(candles));
      await redis.setex(staleCacheKey, 7 * 86400, JSON.stringify(candles));

      this.seedLatestTickFromCandles(symbol, candles, isEOD);
      return candles;
    } catch (error) {
      this.logFetchFailure(error, symbol, fyersSymbol);

      const stale = await redis.get(staleCacheKey);
      if (stale) {
        this.logger.warn(
          { symbol, resolution },
          "Upstream Fyers market data unreachable; serving resilient stale cached candles"
        );
        return JSON.parse(stale) as Candle[];
      }

      throw new AppError(ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE);
    }
  }

  private async resolveAccessTokenOrServeStale(
    symbol: string,
    resolution: string,
    staleCacheKey: string
  ): Promise<string | Candle[]> {
    try {
      return await this.brokerAuthService.getOrRefreshToken();
    } catch (tokenErr) {
      const stale = await redis.get(staleCacheKey);
      if (stale) {
        this.logger.warn(
          { symbol, resolution, tokenErr },
          "Active Fyers access token unavailable; serving resilient stale cached candles"
        );
        return JSON.parse(stale) as Candle[];
      }
      throw new AppError(ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE);
    }
  }

  private buildChunkRanges(
    fyersResolution: string,
    isEOD: boolean,
    fromMs: number,
    toMs: number
  ): CandleChunkRange[] {
    const isSecond = fyersResolution.endsWith("S");
    const maxChunkSec = isEOD ? 365 * 86400 : isSecond ? 30 * 86400 : 100 * 86400;

    const nowSec = Math.floor(Date.now() / 1000);
    const maxHistorySec = isEOD
      ? 5 * 365 * 86400
      : isSecond
        ? 30 * 86400
        : 365 * 86400;
    const earliestAllowedSec = nowSec - maxHistorySec;

    const requestedFromSec = Math.floor(fromMs / 1000);
    const requestedToSec = Math.min(Math.floor(toMs / 1000), nowSec);
    const clampedFromSec = Math.max(requestedFromSec, earliestAllowedSec);

    if (clampedFromSec >= requestedToSec) {
      return [];
    }

    const chunks: CandleChunkRange[] = [];
    let currentFrom = clampedFromSec;
    while (currentFrom < requestedToSec) {
      const currentTo = Math.min(currentFrom + maxChunkSec, requestedToSec);
      chunks.push({ from: currentFrom, to: currentTo });
      currentFrom = currentTo + 1;
    }
    return chunks;
  }

  private async fetchChunksWithRetry(
    initialToken: string,
    symbol: string,
    fyersSymbol: string,
    fyersResolution: string,
    chunks: CandleChunkRange[]
  ): Promise<[number, number, number, number, number, number][][]> {
    const fetchWithToken = (authToken: string) =>
      Promise.all(
        chunks.map(async (chunk) => {
          const response = await axios.get<FyersHistoryResponse>(
            "https://api-t1.fyers.in/data/history",
            {
              headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${authToken}` },
              params: {
                symbol: fyersSymbol,
                resolution: fyersResolution,
                date_format: "0",
                range_from: chunk.from,
                range_to: chunk.to,
              },
              timeout: 8000,
            }
          );

          if (response.data.s === "ok" && response.data.candles) {
            return response.data.candles;
          }
          return [];
        })
      );

    try {
      return await fetchWithToken(initialToken);
    } catch (firstErr) {
      if (axios.isAxiosError(firstErr) && firstErr.response?.status === 401) {
        this.logger.warn(
          { symbol, fyersSymbol },
          "Fyers returned 401 Unauthorized; generating fresh token and retrying..."
        );
        const freshToken = await this.brokerAuthService.getOrRefreshToken(true);
        return await fetchWithToken(freshToken);
      }
      throw firstErr;
    }
  }

  private async serveStaleOrEmpty(
    staleCacheKey: string,
    symbol: string,
    resolution: string
  ): Promise<Candle[]> {
    const stale = await redis.get(staleCacheKey);
    if (stale) {
      this.logger.warn(
        { symbol, resolution },
        "Fyers returned empty candle array; serving existing stale cached candles"
      );
      return JSON.parse(stale) as Candle[];
    }
    return [];
  }

  private normalizeAndSortCandles(
    flatCandles: [number, number, number, number, number, number][]
  ): Candle[] {
    const candleMap = new Map<number, Candle>();
    for (const c of flatCandles) {
      const timestamp = c[0] * 1000;
      if (!candleMap.has(timestamp)) {
        candleMap.set(timestamp, {
          timestamp,
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5],
        });
      }
    }
    return Array.from(candleMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  private seedLatestTickFromCandles(
    symbol: string,
    candles: Candle[],
    isEOD: boolean
  ): void {
    const cleanSymbol = this.symbolRegistry.fromFeedSymbol(symbol);
    const lastCandle = candles[candles.length - 1];
    if (!lastCandle || this.tickCache.has(cleanSymbol)) {
      return;
    }

    const referenceClose = isEOD
      ? (candles[candles.length - 2]?.close ?? lastCandle.open)
      : candles[0].open;
    const change = +(lastCandle.close - referenceClose).toFixed(2);
    const changePercent =
      referenceClose > 0
        ? +(((lastCandle.close - referenceClose) / referenceClose) * 100).toFixed(2)
        : 0;

    this.tickCache.setIfAbsent(cleanSymbol, {
      symbol: cleanSymbol,
      ltp: lastCandle.close,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: referenceClose,
      change,
      changePercent,
      volume: lastCandle.volume,
      timestamp: lastCandle.timestamp,
    });
  }

  private logFetchFailure(
    error: unknown,
    symbol: string,
    fyersSymbol: string
  ): void {
    if (axios.isAxiosError(error)) {
      this.logger.error(
        {
          status: error.response?.status,
          message:
            (error.response?.data as { message?: string } | undefined)?.message ??
            error.message,
          symbol,
          fyersSymbol,
        },
        "Failed to fetch historical candles from Fyers"
      );
      return;
    }
    this.logger.error({ error, symbol }, "Failed to fetch historical candles from Fyers");
  }
}
