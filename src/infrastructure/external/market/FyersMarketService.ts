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

interface IFyersDataSocket {
  on(event: string, callback: (data?: unknown) => void): void;
  subscribe(symbols: string[], flag: boolean | string): void;
  unsubscribe(symbols: string[]): void;
  connect(): void;
  autoreconnect(): void;
  close(): void;
}

type FyersDataSocketConstructor = new (accessToken: string) => IFyersDataSocket;

const FyersDataSocketClass = (
  fyersPkg as { fyersDataSocket: FyersDataSocketConstructor }
).fyersDataSocket;

interface FyersHistoryResponse {
  s: string;
  candles: [number, number, number, number, number, number][];
}

export class FyersMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private activeSubscriptions = new Set<string>();
  private socket: IFyersDataSocket | null = null;
  private isSocketConnected = false;

  constructor() {
    this.initFyersSocket();
  }

  private initFyersSocket(): void {
    const token = env.FYERS_ACCESS_TOKEN;
    if (!token) {
      logger.warn("FYERS_ACCESS_TOKEN not configured; Fyers live WebSocket feed inactive");
      return;
    }

    try {
      this.socket = new FyersDataSocketClass(token);

      this.socket.on("connect", () => {
        this.isSocketConnected = true;
        logger.info("Connected to Fyers Live Exchange WebSocket feed");

        if (this.activeSubscriptions.size > 0) {
          const fyersSymbols = Array.from(this.activeSubscriptions).map((sym) =>
            MarketSymbolMapper.toFyersSymbol(sym)
          );
          this.socket?.subscribe(fyersSymbols, false);
        }
      });

      this.socket.on("message", (msg: unknown) => {
        if (typeof msg === "object" && msg !== null) {
          const raw = msg as Record<string, unknown>;
          if (
            (raw.type === "sf" || raw.type === "if") &&
            typeof raw.symbol === "string" &&
            typeof raw.ltp === "number"
          ) {
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

            this.tickCallbacks.forEach((cb) => cb(tick));
          }
        }
      });

      this.socket.on("error", (err: unknown) => {
        logger.error({ err }, "Fyers Live WebSocket error");
      });

      this.socket.on("close", () => {
        this.isSocketConnected = false;
        logger.warn("Fyers Live WebSocket closed");
      });

      this.socket.connect();
      this.socket.autoreconnect();
    } catch (err: unknown) {
      logger.error({ err }, "Failed to start Fyers Data Socket");
    }
  }

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

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Candle[];
    }

    const token = await this.getAccessToken();
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

    try {
      const chunkResults = await Promise.all(
        chunks.map(async (chunk) => {
          const response = await axios.get<FyersHistoryResponse>("https://api-t1.fyers.in/data/history", {
            headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${token}` },
            params: {
              symbol: fyersSymbol,
              resolution: fyersResolution,
              date_format: "0",
              range_from: chunk.from,
              range_to: chunk.to,
            },
          });

          if (response.data.s === "ok" && response.data.candles) {
            return response.data.candles;
          }
          return [];
        })
      );

      const flatCandles = chunkResults.flat();
      if (flatCandles.length === 0) {
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

      const ttl = isEOD ? 86400 : 300;
      await redis.setex(cacheKey, ttl, JSON.stringify(candles));

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
      return [];
    }
  }

  async getQuote(_symbol: string): Promise<MarketTick | null> {
    return Promise.resolve(null);
  }

  async subscribe(symbols: string[]): Promise<void> {
    const toAdd: string[] = [];

    symbols.forEach((sym) => {
      const clean = sym.toUpperCase().trim();
      if (!this.activeSubscriptions.has(clean)) {
        this.activeSubscriptions.add(clean);
        toAdd.push(MarketSymbolMapper.toFyersSymbol(clean));
      }
    });

    if (this.socket && this.isSocketConnected && toAdd.length > 0) {
      this.socket.subscribe(toAdd, false);
    }

    return Promise.resolve();
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    const toRemove: string[] = [];

    symbols.forEach((sym) => {
      const clean = sym.toUpperCase().trim();
      if (this.activeSubscriptions.has(clean)) {
        this.activeSubscriptions.delete(clean);
        toRemove.push(MarketSymbolMapper.toFyersSymbol(clean));
      }
    });

    if (this.socket && this.isSocketConnected && toRemove.length > 0) {
      this.socket.unsubscribe(toRemove);
    }

    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }
}