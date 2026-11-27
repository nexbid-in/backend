import axios from "axios";
import { IBrokerAuthService } from "../../../../application/interface/services/IBrokerAuthService";
import { ILogger } from "../../../../application/interface/services/ILogger";
import { IMarketDepthReader } from "../../../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../../../application/interface/services/IMarketSymbolRegistry";
import { MarketQuote } from "../../../../domain/entities/market/MarketQuote";
import { env } from "../../../config/env";
import redis from "../../../config/redis";
import { MarketTickCache } from "../MarketTickCache";

interface FyersDepthResponse {
  s: string;
  d?: Record<
    string,
    {
      totalbuyqty?: number;
      totalsellqty?: number;
      bids?: Array<{ price: number; volume: number; ord: number }>;
      ask?: Array<{ price: number; volume: number; ord: number }>;
      o?: number;
      h?: number;
      l?: number;
      c?: number;
      ch?: number;
      chp?: number;
      ltp?: number;
      v?: number;
      atp?: number;
      lower_ckt?: number;
      upper_ckt?: number;
    }
  >;
}

/**
 * Fetches market depth snapshots from Fyers with short-TTL Redis caching and tick warm-up.
 */
export class FyersMarketDepthClient implements IMarketDepthReader {
  constructor(
    private readonly brokerAuthService: IBrokerAuthService,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    private readonly tickCache: MarketTickCache,
    private readonly logger: ILogger
  ) {}

  async getMarketDepth(symbol: string): Promise<Partial<MarketQuote> | null> {
    const clean = this.symbolRegistry.fromFeedSymbol(symbol.toUpperCase().trim());
    const fyersSymbol = this.symbolRegistry.toFeedSymbol(clean);

    if (fyersSymbol.includes("-INDEX")) {
      return null;
    }

    const depthCacheKey = `market:depth:v2:${clean}`;
    try {
      const cached = await redis.get(depthCacheKey);
      if (cached) {
        return JSON.parse(cached) as Partial<MarketQuote>;
      }
    } catch {
      /* ignore */
    }

    try {
      const token = await this.brokerAuthService.getOrRefreshToken();
      const response = await axios.get<FyersDepthResponse>(
        "https://api-t1.fyers.in/data/depth",
        {
          params: { symbol: fyersSymbol, ohlcv_flag: 1 },
          headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${token}` },
          timeout: 4000,
        }
      );

      const depthData = response.data?.d?.[fyersSymbol];
      if (!depthData) {
        return null;
      }

      const ltp = depthData.ltp;
      const change = depthData.ch;
      const derivedPrevClose =
        ltp !== undefined && typeof change === "number"
          ? +(ltp - change).toFixed(2)
          : depthData.c && depthData.c > 0
            ? depthData.c
            : undefined;

      const depthResult: Partial<MarketQuote> = {
        ...(ltp !== undefined && { ltp }),
        ...(depthData.o !== undefined && { open: depthData.o }),
        ...(depthData.h !== undefined && { high: depthData.h }),
        ...(depthData.l !== undefined && { low: depthData.l }),
        ...(derivedPrevClose !== undefined && { close: derivedPrevClose }),
        ...(change !== undefined && { change }),
        ...(depthData.chp !== undefined && { changePercent: depthData.chp }),
        ...(depthData.v !== undefined && { volume: depthData.v }),
        atp: depthData.atp,
        lowerCircuit: depthData.lower_ckt ?? null,
        upperCircuit: depthData.upper_ckt ?? null,
        totalBuyQty: depthData.totalbuyqty ?? null,
        totalSellQty: depthData.totalsellqty ?? null,
        bidPrice: depthData.bids?.[0]?.price ?? null,
        askPrice: depthData.ask?.[0]?.price ?? null,
      };

      if (ltp && ltp > 0) {
        this.tickCache.setIfAbsent(clean, {
          symbol: clean,
          ltp,
          open: depthData.o ?? ltp,
          high: depthData.h ?? ltp,
          low: depthData.l ?? ltp,
          close: derivedPrevClose ?? ltp,
          change: change ?? 0,
          changePercent: depthData.chp ?? 0,
          volume: depthData.v ?? 0,
          atp: depthData.atp ?? ltp,
          totalBuyQty: depthData.totalbuyqty ?? null,
          totalSellQty: depthData.totalsellqty ?? null,
          bidPrice: depthData.bids?.[0]?.price ?? null,
          askPrice: depthData.ask?.[0]?.price ?? null,
          timestamp: Date.now(),
        });
      }

      void redis.set(depthCacheKey, JSON.stringify(depthResult), "EX", 15);
      return depthResult;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        this.logger.warn(
          {
            symbol: clean,
            status: err.response?.status,
            reason:
              (err.response?.data as { message?: string } | undefined)?.message ||
              err.message,
          },
          "Fyers market depth fetch skipped/failed"
        );
      } else {
        this.logger.warn(
          { symbol: clean, error: err },
          "Unexpected error fetching Fyers market depth"
        );
      }
      return null;
    }
  }
}
