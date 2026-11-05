import axios from "axios";
// @ts-expect-error fyers-api-v3 does not ship with built-in typescript declarations
import fyersPkg from "fyers-api-v3";
import redis from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../logging/logger";
import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketSymbolMapper } from "./MarketSymbolMapper";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { FyersAuthService } from "./FyersAuthService";
import { IBrokerAuthService } from "../../../application/interface/services/IBrokerAuthService";

interface IFyersDataSocket {
  on(event: string, callback: (data?: unknown) => void): void;
  subscribe(symbols: string[], flag?: boolean | string): void;
  unsubscribe(symbols: string[]): void;
  connect(): void;
  autoreconnect(): void;
  close(): void;
}

type FyersDataSocketFactory = {
  getInstance(accessToken: string): IFyersDataSocket;
};

const FyersDataSocketClass = (
  fyersPkg as { fyersDataSocket: FyersDataSocketFactory }
).fyersDataSocket;

interface FyersHistoryResponse {
  s: string;
  candles: [number, number, number, number, number, number][];
}

export class FyersMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private activeSubscriptions = new Set<string>();
  private subscribedToBroker = new Set<string>();
  private latestTicks = new Map<string, MarketTick>();
  private socket: IFyersDataSocket | null = null;
  private currentSocketToken: string | null = null;
  private isSocketConnected = false;
  private isConnecting = false;

  constructor(private readonly brokerAuthService: IBrokerAuthService) {
    // Upstream data socket connects on demand upon the first symbol subscription
  }

  private isIndianMarketOpen(): boolean {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utcMs + 5.5 * 3600000);

    const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return false;
    }

    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // NSE / BSE normal trading hours: 09:15 AM (555 min) to 03:30 PM (930 min) IST
    return timeInMinutes >= 555 && timeInMinutes <= 930;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8")) as { exp?: number };
      if (typeof payload.exp !== "number") return true;
      // Consider expired if expiring within 60 seconds
      return payload.exp * 1000 <= Date.now() + 60000;
    } catch {
      return true;
    }
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    if (forceRefresh) {
      logger.info("Forced refresh requested; generating new Fyers access token...");
      return this.brokerAuthService.generateAndStoreAccessToken();
    }

    let token = await redis.get(FyersAuthService.REDIS_TOKEN_KEY);
    if (token && this.isTokenExpired(token)) {
      logger.warn("Cached Fyers access token in Redis is expired; generating fresh token...");
      token = null;
    }

    if (!token) {
      logger.info("Fyers access token not found or expired; generating via automated auth...");
      try {
        token = await this.brokerAuthService.generateAndStoreAccessToken();
      } catch (authErr) {
        logger.error({ authErr }, "Failed automated Fyers token generation");
      }
    }

    if (!token) {
      const envToken = env.FYERS_ACCESS_TOKEN;
      if (envToken && !this.isTokenExpired(envToken)) {
        token = envToken;
      }
    }

    if (!token) {
      throw new Error("Active Fyers access token not found in Redis, .env, or via automated auth");
    }
    return token;
  }

  private async ensureSocketConnected(): Promise<void> {
    if (this.activeSubscriptions.size === 0) {
      return;
    }

    let token: string;
    try {
      token = await this.getAccessToken();
    } catch (tokenErr) {
      logger.warn({ tokenErr }, "Fyers live WebSocket inactive: Access token unavailable");
      return;
    }

    if (this.socket && this.isSocketConnected && this.currentSocketToken === token) {
      return;
    }

    if (this.socket && this.currentSocketToken !== token) {
      logger.info("Fyers access token refreshed; re-establishing WebSocket feed");
      try {
        this.socket.close();
      } catch {
        // ignore close error
      }
      (fyersPkg as { fyersDataSocket: { instance?: unknown } }).fyersDataSocket.instance = null;
      this.socket = null;
      this.isSocketConnected = false;
      this.subscribedToBroker.clear();
    }

    if (!this.socket) {
      if (this.isConnecting) return;
      this.isConnecting = true;

      try {
        this.currentSocketToken = token;
        this.socket = FyersDataSocketClass.getInstance(token);

        this.socket.on("connect", () => {
          this.isSocketConnected = true;
          this.isConnecting = false;
          logger.info("Connected to Fyers Live Exchange WebSocket feed");

          if (this.activeSubscriptions.size > 0) {
            const fyersSymbols = Array.from(this.activeSubscriptions).map((sym) =>
              MarketSymbolMapper.toFyersSymbol(sym)
            );
            logger.info({ fyersSymbols }, "Subscribing active symbols to Fyers Live feed");
            this.socket?.subscribe(fyersSymbols);
            this.activeSubscriptions.forEach((sym) => this.subscribedToBroker.add(sym));
          }
        });

        this.socket.on("message", (msg: unknown) => {
          if (typeof msg === "object" && msg !== null) {
            const raw = msg as Record<string, unknown>;
            if (typeof raw.symbol === "string" && typeof raw.ltp === "number") {
              const cleanSymbol = MarketSymbolMapper.fromFyersSymbol(raw.symbol);
              const ltp = raw.ltp;
              const open = typeof raw.open_price === "number" ? raw.open_price : ltp;
              const high = typeof raw.high_price === "number" ? raw.high_price : ltp;
              const low = typeof raw.low_price === "number" ? raw.low_price : ltp;
              const close = typeof raw.prev_close_price === "number" ? raw.prev_close_price : ltp;
              const change = typeof raw.ch === "number" ? raw.ch : +(ltp - close).toFixed(2);
              const changePercent =
                typeof raw.chp === "number"
                  ? raw.chp
                  : close > 0
                  ? +(((ltp - close) / close) * 100).toFixed(2)
                  : 0;
              const volume = typeof raw.vol_traded_today === "number" ? raw.vol_traded_today : 0;
              const timestamp =
                typeof raw.last_traded_time === "number"
                  ? raw.last_traded_time * 1000
                  : typeof raw.exch_feed_time === "number"
                  ? raw.exch_feed_time * 1000
                  : Date.now();

              const tick: MarketTick = {
                symbol: cleanSymbol,
                ltp,
                open,
                high,
                low,
                close,
                change,
                changePercent,
                volume,
                timestamp,
              };

              this.latestTicks.set(cleanSymbol, tick);
              this.tickCallbacks.forEach((cb) => cb(tick));
            }
          }
        });

        this.socket.on("error", (err: unknown) => {
          this.isConnecting = false;
          logger.error({ err }, "Fyers Live WebSocket error");
        });

        this.socket.on("close", () => {
          this.isSocketConnected = false;
          this.isConnecting = false;
          this.subscribedToBroker.clear();

          if (this.activeSubscriptions.size === 0) {
            logger.info("Fyers Live WebSocket closed; 0 active subscriptions, putting socket to sleep");
            this.socket = null;
            return;
          }

          if (!this.isIndianMarketOpen()) {
            logger.info("Fyers Live WebSocket closed outside market trading hours (09:15-15:30 IST)");
          } else {
            logger.warn("Fyers Live WebSocket closed during active market hours; autoreconnect active");
          }
        });

        this.socket.connect();
        this.socket.autoreconnect();
      } catch (err: unknown) {
        this.isConnecting = false;
        logger.error({ err }, "Failed to start Fyers Data Socket");
        this.socket = null;
        this.isSocketConnected = false;
      }
    } else if (!this.isSocketConnected) {
      try {
        this.socket.connect();
      } catch (err) {
        logger.error({ err }, "Failed to connect Fyers Data Socket");
      }
    }
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const cacheKey = `market:candles:${symbol}:${resolution}:${Math.floor(from / 60000)}:${Math.floor(to / 60000)}`;
    const staleCacheKey = `market:candles:stale:${symbol}:${resolution}`;

    // 1. Exact time-window cache hit
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Candle[];
    }

    let token: string;
    try {
      token = await this.getAccessToken();
    } catch (tokenErr) {
      // If access token is unavailable, check for resilient stale data before failing
      const stale = await redis.get(staleCacheKey);
      if (stale) {
        logger.warn(
          { symbol, resolution, tokenErr },
          "Active Fyers access token unavailable; serving resilient stale cached candles"
        );
        return JSON.parse(stale) as Candle[];
      }
      throw new AppError(
        ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE,
        "Market data feed is temporarily unavailable. Please retry shortly."
      );
    }

    const fyersSymbol = MarketSymbolMapper.toFyersSymbol(symbol);
    const fyersResolution = resolution === "1D" || resolution === "D" ? "D" : resolution;

    // Fyers maximum date-range per single request:
    // - Daily / Weekly / Monthly: max 365 days
    // - Intraday minutes: max 100 days
    // - Seconds: max 30 days
    const isEOD = ["D", "W", "M", "1D", "1W", "1M"].includes(fyersResolution);
    const isSecond = fyersResolution.endsWith("S");
    const maxChunkSec = isEOD ? 365 * 86400 : isSecond ? 30 * 86400 : 100 * 86400;

    // Fyers Standard Plan retention bounds (5 years EOD, 1 year Intraday)
    const nowSec = Math.floor(Date.now() / 1000);
    const maxHistorySec = isEOD ? 5 * 365 * 86400 : isSecond ? 30 * 86400 : 365 * 86400;
    const earliestAllowedSec = nowSec - maxHistorySec;

    const requestedFromSec = Math.floor(from / 1000);
    const requestedToSec = Math.min(Math.floor(to / 1000), nowSec);
    const clampedFromSec = Math.max(requestedFromSec, earliestAllowedSec);

    if (clampedFromSec >= requestedToSec) {
      return [];
    }

    // Generate chunk intervals
    const chunks: { from: number; to: number }[] = [];
    let currentFrom = clampedFromSec;
    while (currentFrom < requestedToSec) {
      const currentTo = Math.min(currentFrom + maxChunkSec, requestedToSec);
      chunks.push({ from: currentFrom, to: currentTo });
      currentFrom = currentTo + 1;
    }

    const fetchWithToken = async (authToken: string) => {
      return Promise.all(
        chunks.map(async (chunk) => {
          const response = await axios.get<FyersHistoryResponse>("https://api-t1.fyers.in/data/history", {
            headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${authToken}` },
            params: {
              symbol: fyersSymbol,
              resolution: fyersResolution,
              date_format: "0",
              range_from: chunk.from,
              range_to: chunk.to,
            },
            timeout: 8000,
          });

          if (response.data.s === "ok" && response.data.candles) {
            return response.data.candles;
          }
          return [];
        })
      );
    };

    try {
      let chunkResults: [number, number, number, number, number, number][][];
      try {
        chunkResults = await fetchWithToken(token);
      } catch (firstErr) {
        if (axios.isAxiosError(firstErr) && firstErr.response?.status === 401) {
          logger.warn({ symbol, fyersSymbol }, "Fyers returned 401 Unauthorized; generating fresh token and retrying...");
          const freshToken = await this.getAccessToken(true);
          chunkResults = await fetchWithToken(freshToken);
        } else {
          throw firstErr;
        }
      }

      const flatCandles = chunkResults.flat();
      if (flatCandles.length === 0) {
        // If upstream returned 0 candles, check for existing stale candles before concluding empty
        const stale = await redis.get(staleCacheKey);
        if (stale) {
          logger.warn(
            { symbol, resolution },
            "Fyers returned empty candle array; serving existing stale cached candles"
          );
          return JSON.parse(stale) as Candle[];
        }
        return [];
      }

      // Deduplicate and sort by timestamp
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

      const candles = Array.from(candleMap.values()).sort((a, b) => a.timestamp - b.timestamp);

      // Exact window cache (1 day for daily, 5 min for intraday)
      const ttl = isEOD ? 86400 : 300;
      await redis.setex(cacheKey, ttl, JSON.stringify(candles));

      // Resilient Stale-While-Revalidate fallback cache (7 days) for outage survival
      await redis.setex(staleCacheKey, 7 * 86400, JSON.stringify(candles));

      // Seed latest tick if not present
      const cleanSymbol = MarketSymbolMapper.fromFyersSymbol(symbol);
      const lastCandle = candles[candles.length - 1];
      if (lastCandle && !this.latestTicks.has(cleanSymbol)) {
        const firstCandle = candles[0];
        const change = +(lastCandle.close - firstCandle.open).toFixed(2);
        const changePercent =
          firstCandle.open > 0 ? +(((lastCandle.close - firstCandle.open) / firstCandle.open) * 100).toFixed(2) : 0;
        this.latestTicks.set(cleanSymbol, {
          symbol: cleanSymbol,
          ltp: lastCandle.close,
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          change,
          changePercent,
          volume: lastCandle.volume,
          timestamp: lastCandle.timestamp,
        });
      }

      return candles;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          {
            status: error.response?.status,
            message: (error.response?.data as { message?: string } | undefined)?.message ?? error.message,
            symbol,
            fyersSymbol,
          },
          "Failed to fetch historical candles from Fyers"
        );
      } else {
        logger.error({ error, symbol }, "Failed to fetch historical candles from Fyers");
      }

      // 1. Stale-While-Revalidate Fallback:
      // If Fyers is offline (e.g. ENOTFOUND, ETIMEDOUT, 502/503), serve last known candles
      const stale = await redis.get(staleCacheKey);
      if (stale) {
        logger.warn(
          { symbol, resolution },
          "Upstream Fyers market data unreachable; serving resilient stale cached candles"
        );
        return JSON.parse(stale) as Candle[];
      }

      // 2. If no stale cache exists, signal explicit 503 Service Unavailable
      throw new AppError(
        ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE,
        "Market data feed is temporarily unavailable. Please retry shortly."
      );
    }
  }

  async getQuote(symbol: string): Promise<MarketTick | null> {
    const clean = MarketSymbolMapper.fromFyersSymbol(symbol.toUpperCase().trim());
    return Promise.resolve(this.latestTicks.get(clean) ?? null);
  }

  async subscribe(symbols: string[]): Promise<void> {
    const newlyAdded: string[] = [];

    symbols.forEach((sym) => {
      const clean = MarketSymbolMapper.fromFyersSymbol(sym.toUpperCase().trim());
      this.activeSubscriptions.add(clean);
      if (!this.subscribedToBroker.has(clean)) {
        newlyAdded.push(clean);
      }
    });

    await this.ensureSocketConnected();

    if (this.socket && this.isSocketConnected && newlyAdded.length > 0) {
      const fyersSymbols = newlyAdded.map((s) => MarketSymbolMapper.toFyersSymbol(s));
      logger.info({ fyersSymbols }, "Subscribing newly added symbols to Fyers Data Socket");
      this.socket.subscribe(fyersSymbols);
      newlyAdded.forEach((s) => this.subscribedToBroker.add(s));
    }
  }

  unsubscribe(symbols: string[]): Promise<void> {
    const toRemove: string[] = [];

    symbols.forEach((sym) => {
      const clean = MarketSymbolMapper.fromFyersSymbol(sym.toUpperCase().trim());
      this.activeSubscriptions.delete(clean);
      if (this.subscribedToBroker.has(clean)) {
        this.subscribedToBroker.delete(clean);
        toRemove.push(MarketSymbolMapper.toFyersSymbol(clean));
      }
    });

    if (this.socket && this.isSocketConnected && toRemove.length > 0) {
      this.socket.unsubscribe(toRemove);
    }

    // Lazy Standby: If 0 subscriptions remain across the platform, close the idle upstream socket
    if (this.activeSubscriptions.size === 0 && this.socket) {
      logger.info("No active subscriptions remaining across gateway; closing idle Fyers socket");
      try {
        this.socket.close();
      } catch {
        // ignore close error
      }
      this.socket = null;
      this.isSocketConnected = false;
      this.subscribedToBroker.clear();
    }

    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }
}