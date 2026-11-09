import { IGetStockOverviewUseCase } from "../../interface/use-cases/market/IGetStockOverviewUseCase";
import {
  GetStockOverviewRequestDTO,
  StockOverviewResponseDTO,
  StockOverviewVitalsDTO,
  StockRange52WDTO,
  StockPerformanceReturnsDTO,
} from "../../dto/market/StockOverviewDTO";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import redis from "../../../infrastructure/config/redis";
import { logger } from "../../../infrastructure/logging/logger";

export class GetStockOverviewUseCase implements IGetStockOverviewUseCase {
  private static readonly CACHE_TTL_SECONDS = 43200; // 12 hours

  constructor(
    private readonly _stockRepository: IStockRepository,
    private readonly _marketDataService: IMarketDataService
  ) {}

  async execute(data: GetStockOverviewRequestDTO): Promise<StockOverviewResponseDTO> {
    const cleanSymbol = data.symbol.toUpperCase().trim();

    // 1. Fetch stock metadata from repository
    const stock = await this._stockRepository.findBySymbol(cleanSymbol);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND, `Stock '${cleanSymbol}' not found`);
    }

    // 2. Fetch live quote (in-memory) and market depth (cached / broker API)
    const quote = await this._marketDataService.getQuote(cleanSymbol);
    const depth = this._marketDataService.getMarketDepth
      ? await this._marketDataService.getMarketDepth(cleanSymbol)
      : null;

    const vitals: StockOverviewVitalsDTO = {
      ltp: quote?.ltp ?? 0,
      change: quote?.change ?? 0,
      changePercent: quote?.changePercent ?? 0,
      open: quote?.open ?? 0,
      high: quote?.high ?? 0,
      low: quote?.low ?? 0,
      close: quote?.close ?? 0,
      volume: quote?.volume ?? 0,
      atp: depth?.atp ?? quote?.atp ?? (quote?.ltp ?? 0),
      lowerCircuit: depth?.lowerCircuit ?? quote?.lowerCircuit ?? null,
      upperCircuit: depth?.upperCircuit ?? quote?.upperCircuit ?? null,
      totalBuyQty: depth?.totalBuyQty ?? quote?.totalBuyQty ?? null,
      totalSellQty: depth?.totalSellQty ?? quote?.totalSellQty ?? null,
      bidPrice: depth?.bidPrice ?? quote?.bidPrice ?? null,
      askPrice: depth?.askPrice ?? quote?.askPrice ?? null,
    };

    // 3. Compute or fetch 52-week range and historical performance returns
    const { range52W, performance } = await this.get52WeekAndPerformance(cleanSymbol, vitals);

    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      type: stock.type,
      isTradable: stock.isTradable,
      isActive: stock.isActive,
      vitals,
      range52W,
      performance,
      lastUpdated: quote?.timestamp ?? Date.now(),
    };
  }

  private async get52WeekAndPerformance(
    symbol: string,
    vitals: StockOverviewVitalsDTO
  ): Promise<{ range52W: StockRange52WDTO; performance: StockPerformanceReturnsDTO }> {
    const cacheKey = `market:stats:52w:${symbol}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          range52W: StockRange52WDTO;
          performance: StockPerformanceReturnsDTO;
        };
        // Update 52W range dynamically if today's high/low breaches cached bounds
        const dynamicHigh = Math.max(parsed.range52W.high, vitals.high);
        const dynamicLow =
          vitals.low > 0 ? Math.min(parsed.range52W.low, vitals.low) : parsed.range52W.low;

        return {
          range52W: { high: dynamicHigh, low: dynamicLow },
          performance: parsed.performance,
        };
      }
    } catch (cacheErr) {
      logger.warn({ symbol, cacheErr }, "Failed to read 52W stats cache from Redis");
    }

    // Cache miss: Calculate 52W High/Low and 1W/1M/1Y returns from 1-year daily candles
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

    let range52W: StockRange52WDTO = {
      high: vitals.high > 0 ? vitals.high : vitals.ltp,
      low: vitals.low > 0 ? vitals.low : vitals.ltp,
    };

    const performance: StockPerformanceReturnsDTO = {
      oneWeek: null,
      oneMonth: null,
      oneYear: null,
    };

    try {
      const candles = await this._marketDataService.getHistoricalCandles(
        symbol,
        "D",
        oneYearAgo,
        now
      );

      if (candles && candles.length > 0) {
        const highs = candles.map((c) => c.high);
        const lows = candles.map((c) => c.low);

        if (vitals.high > 0) highs.push(vitals.high);
        if (vitals.low > 0) lows.push(vitals.low);

        range52W = {
          high: +Math.max(...highs).toFixed(2),
          low: +Math.min(...lows).toFixed(2),
        };

        const currentPrice = vitals.ltp > 0 ? vitals.ltp : candles[candles.length - 1].close;

        // 1-Week Return (approx. 5 trading days ago)
        if (candles.length >= 6) {
          const candle1W = candles[candles.length - 6];
          if (candle1W.close > 0) {
            performance.oneWeek = +(((currentPrice - candle1W.close) / candle1W.close) * 100).toFixed(2);
          }
        }

        // 1-Month Return (approx. 21 trading days ago)
        if (candles.length >= 22) {
          const candle1M = candles[candles.length - 22];
          if (candle1M.close > 0) {
            performance.oneMonth = +(((currentPrice - candle1M.close) / candle1M.close) * 100).toFixed(2);
          }
        }

        // 1-Year Return (first candle in 1-year dataset)
        const candle1Y = candles[0];
        if (candle1Y.close > 0) {
          performance.oneYear = +(((currentPrice - candle1Y.close) / candle1Y.close) * 100).toFixed(2);
        }

        // Store computed stats in Redis with 12-hour TTL
        await redis.set(
          cacheKey,
          JSON.stringify({ range52W, performance }),
          "EX",
          GetStockOverviewUseCase.CACHE_TTL_SECONDS
        );
      }
    } catch (err) {
      logger.warn({ symbol, err }, "Failed to fetch 1-year history for 52W stats calculation");
    }

    return { range52W, performance };
  }
}

