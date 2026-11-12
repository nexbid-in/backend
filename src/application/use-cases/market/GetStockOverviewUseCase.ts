import { IGetStockOverviewUseCase } from "../../interface/use-cases/market/IGetStockOverviewUseCase";
import {
  GetStockOverviewRequestDTO,
  StockOverviewResponseDTO,
  StockOverviewVitalsDTO,
  StockRange52WDTO,
  StockPerformanceReturnsDTO,
  StockPerformanceAnchorsDTO,
} from "../../dto/market/StockOverviewDTO";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import redis from "../../../infrastructure/config/redis";
import { logger } from "../../../infrastructure/logging/logger";

interface CachedOverviewStats {
  range52W: StockRange52WDTO;
  anchors: StockPerformanceAnchorsDTO;
  fallbackClose: number | null;
}

export class GetStockOverviewUseCase implements IGetStockOverviewUseCase {
  private static readonly CACHE_TTL_SECONDS = 43200;
  private static readonly IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  private static readonly DAY_MS = 24 * 60 * 60 * 1000;
  private static readonly LOOKBACK_DAYS = 400;
  private static readonly YEAR_DAYS = 365;

  constructor(
    private readonly _stockRepository: IStockRepository,
    private readonly _marketDataService: IMarketDataService
  ) {}

  async execute(data: GetStockOverviewRequestDTO): Promise<StockOverviewResponseDTO> {
    const cleanSymbol = data.symbol.toUpperCase().trim();

    const stock = await this._stockRepository.findBySymbol(cleanSymbol);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND, `Stock '${cleanSymbol}' not found`);
    }

    const quote = await this._marketDataService.getQuote(cleanSymbol);
    const depth = this._marketDataService.getMarketDepth
      ? await this._marketDataService.getMarketDepth(cleanSymbol)
      : null;

    const liveQuote = quote && quote.ltp > 0 ? quote : null;
    const ltp = liveQuote ? liveQuote.ltp : (depth?.ltp ?? quote?.ltp ?? 0);

    const vitals: StockOverviewVitalsDTO = {
      ltp,
      change: liveQuote ? liveQuote.change : (depth?.change ?? quote?.change ?? 0),
      changePercent: liveQuote ? liveQuote.changePercent : (depth?.changePercent ?? quote?.changePercent ?? 0),
      open: liveQuote && liveQuote.open > 0 ? liveQuote.open : (depth?.open ?? quote?.open ?? 0),
      high: liveQuote && liveQuote.high > 0 ? liveQuote.high : (depth?.high ?? quote?.high ?? 0),
      low: liveQuote && liveQuote.low > 0 ? liveQuote.low : (depth?.low ?? quote?.low ?? 0),
      close: liveQuote && liveQuote.close > 0 ? liveQuote.close : (depth?.close ?? quote?.close ?? 0),
      volume: liveQuote ? liveQuote.volume : (depth?.volume ?? quote?.volume ?? 0),
      atp: depth?.atp ?? quote?.atp ?? ltp,
      lowerCircuit: depth?.lowerCircuit ?? quote?.lowerCircuit ?? null,
      upperCircuit: depth?.upperCircuit ?? quote?.upperCircuit ?? null,
      totalBuyQty: depth?.totalBuyQty ?? quote?.totalBuyQty ?? null,
      totalSellQty: depth?.totalSellQty ?? quote?.totalSellQty ?? null,
      bidPrice: depth?.bidPrice ?? quote?.bidPrice ?? null,
      askPrice: depth?.askPrice ?? quote?.askPrice ?? null,
    };

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
    const now = Date.now();
    const todayIstKey = GetStockOverviewUseCase.toIstDateKey(now);
    const cacheKey = `market:stats:overview:v2:${symbol}:${todayIstKey}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<CachedOverviewStats>;
        if (parsed.range52W && parsed.anchors) {
          const dynamicHigh = Math.max(parsed.range52W.high, vitals.high, vitals.ltp);
          const lowCandidates = [parsed.range52W.low, vitals.low, vitals.ltp].filter((v) => v > 0);
          const dynamicLow =
            lowCandidates.length > 0 ? Math.min(...lowCandidates) : parsed.range52W.low;

          const effectiveAnchors: StockPerformanceAnchorsDTO = {
            ...parsed.anchors,
            oneDay: vitals.close > 0 ? vitals.close : parsed.anchors.oneDay,
          };
          const currentPrice = vitals.ltp > 0 ? vitals.ltp : (parsed.fallbackClose ?? 0);

          return {
            range52W: { high: +dynamicHigh.toFixed(2), low: +dynamicLow.toFixed(2) },
            performance: this.computePerformance(currentPrice, effectiveAnchors),
          };
        }
      }
    } catch (cacheErr) {
      logger.warn({ symbol, cacheErr }, "Failed to read overview stats cache from Redis");
    }

    const lookbackStart = now - GetStockOverviewUseCase.LOOKBACK_DAYS * GetStockOverviewUseCase.DAY_MS;
    const oneYearCutoff = now - GetStockOverviewUseCase.YEAR_DAYS * GetStockOverviewUseCase.DAY_MS;

    let range52W: StockRange52WDTO = {
      high: vitals.high > 0 ? vitals.high : vitals.ltp,
      low: vitals.low > 0 ? vitals.low : vitals.ltp,
    };

    let anchors: StockPerformanceAnchorsDTO = {
      oneDay: vitals.close > 0 ? vitals.close : null,
      oneWeek: null,
      oneMonth: null,
      threeMonths: null,
      sixMonths: null,
      ytd: null,
      oneYear: null,
    };
    let fallbackClose: number | null = null;

    try {
      const candles = await this._marketDataService.getHistoricalCandles(
        symbol,
        "D",
        lookbackStart,
        now
      );

      if (candles && candles.length > 0) {
        const yearCandles = candles.filter((c) => c.timestamp >= oneYearCutoff);
        const statsCandles = yearCandles.length > 0 ? yearCandles : candles;

        const highs = statsCandles.map((c) => c.high);
        const lows = statsCandles.map((c) => c.low).filter((v) => v > 0);

        if (vitals.high > 0) highs.push(vitals.high);
        if (vitals.ltp > 0) highs.push(vitals.ltp);
        if (vitals.low > 0) lows.push(vitals.low);
        if (vitals.ltp > 0) lows.push(vitals.ltp);

        range52W = {
          high: highs.length > 0 ? +Math.max(...highs).toFixed(2) : range52W.high,
          low: lows.length > 0 ? +Math.min(...lows).toFixed(2) : range52W.low,
        };

        anchors = this.resolveAnchors(candles, todayIstKey, vitals);
        const latestCandle = candles[candles.length - 1];
        fallbackClose = latestCandle && latestCandle.close > 0 ? latestCandle.close : null;

        const payload: CachedOverviewStats = { range52W, anchors, fallbackClose };
        await redis.set(
          cacheKey,
          JSON.stringify(payload),
          "EX",
          GetStockOverviewUseCase.CACHE_TTL_SECONDS
        );
      }
    } catch (err) {
      logger.warn({ symbol, err }, "Failed to fetch historical candles for overview stats");
    }

    const effectiveAnchors: StockPerformanceAnchorsDTO = {
      ...anchors,
      oneDay: vitals.close > 0 ? vitals.close : anchors.oneDay,
    };
    const currentPrice = vitals.ltp > 0 ? vitals.ltp : (fallbackClose ?? 0);

    return {
      range52W,
      performance: this.computePerformance(currentPrice, effectiveAnchors),
    };
  }

  private resolveAnchors(
    candles: Candle[],
    todayIstKey: string,
    vitals: StockOverviewVitalsDTO
  ): StockPerformanceAnchorsDTO {
    const datedCandles = candles
      .filter((c) => c.close > 0)
      .map((c) => ({ dateKey: GetStockOverviewUseCase.toIstDateKey(c.timestamp), close: c.close }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const completedCandles = datedCandles.filter((c) => c.dateKey < todayIstKey);
    const currentYear = Number(todayIstKey.slice(0, 4));
    const prevYearEndKey = `${currentYear - 1}-12-31`;

    let oneDayAnchor: number | null = null;
    if (vitals.close > 0) {
      oneDayAnchor = vitals.close;
    } else if (vitals.ltp > 0) {
      oneDayAnchor = completedCandles[completedCandles.length - 1]?.close ?? null;
    } else {
      oneDayAnchor =
        datedCandles.length >= 2 ? datedCandles[datedCandles.length - 2].close : null;
    }

    const findOnOrBefore = (targetDateKey: string): number | null => {
      for (let i = completedCandles.length - 1; i >= 0; i--) {
        if (completedCandles[i].dateKey <= targetDateKey) {
          return completedCandles[i].close;
        }
      }
      return null;
    };

    return {
      oneDay: oneDayAnchor,
      oneWeek: findOnOrBefore(GetStockOverviewUseCase.subtractCalendarDays(todayIstKey, 7)),
      oneMonth: findOnOrBefore(GetStockOverviewUseCase.subtractCalendarDays(todayIstKey, 30)),
      threeMonths: findOnOrBefore(GetStockOverviewUseCase.subtractCalendarDays(todayIstKey, 90)),
      sixMonths: findOnOrBefore(GetStockOverviewUseCase.subtractCalendarDays(todayIstKey, 180)),
      ytd: findOnOrBefore(prevYearEndKey),
      oneYear: findOnOrBefore(GetStockOverviewUseCase.subtractCalendarDays(todayIstKey, 365)),
    };
  }

  private computePerformance(
    currentPrice: number,
    anchors: StockPerformanceAnchorsDTO
  ): StockPerformanceReturnsDTO {
    return {
      oneDay: this.computeReturnPercent(currentPrice, anchors.oneDay),
      oneWeek: this.computeReturnPercent(currentPrice, anchors.oneWeek),
      oneMonth: this.computeReturnPercent(currentPrice, anchors.oneMonth),
      threeMonths: this.computeReturnPercent(currentPrice, anchors.threeMonths),
      sixMonths: this.computeReturnPercent(currentPrice, anchors.sixMonths),
      ytd: this.computeReturnPercent(currentPrice, anchors.ytd),
      oneYear: this.computeReturnPercent(currentPrice, anchors.oneYear),
      anchors,
    };
  }

  private computeReturnPercent(currentPrice: number, anchorClose: number | null): number | null {
    if (currentPrice <= 0 || !anchorClose || anchorClose <= 0) {
      return null;
    }
    return +(((currentPrice - anchorClose) / anchorClose) * 100).toFixed(2);
  }

  private static toIstDateKey(tsMs: number): string {
    return new Date(tsMs + GetStockOverviewUseCase.IST_OFFSET_MS).toISOString().slice(0, 10);
  }

  private static subtractCalendarDays(dateKey: string, days: number): string {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
  }
}

