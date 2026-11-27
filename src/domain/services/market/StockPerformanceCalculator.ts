import { Candle } from "../../entities/market/Candle";
import { MarketQuote } from "../../entities/market/MarketQuote";

export interface StockVitals {
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  atp: number;
  lowerCircuit: number | null;
  upperCircuit: number | null;
  totalBuyQty: number | null;
  totalSellQty: number | null;
  bidPrice: number | null;
  askPrice: number | null;
}

export interface StockRange52W {
  high: number;
  low: number;
}

export interface StockPerformanceAnchors {
  oneDay: number | null;
  oneWeek: number | null;
  oneMonth: number | null;
  threeMonths: number | null;
  sixMonths: number | null;
  ytd: number | null;
  oneYear: number | null;
}

export interface StockPerformanceReturns {
  oneDay: number | null;
  oneWeek: number | null;
  oneMonth: number | null;
  threeMonths: number | null;
  sixMonths: number | null;
  ytd: number | null;
  oneYear: number | null;
  anchors: StockPerformanceAnchors;
}

export interface StockOverviewStats {
  range52W: StockRange52W;
  anchors: StockPerformanceAnchors;
  fallbackClose: number | null;
}

/**
 * Pure domain calculator for stock vitals, 52-week ranges, and historical return metrics.
 */
export class StockPerformanceCalculator {
  private static readonly IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  private static readonly DAY_MS = 24 * 60 * 60 * 1000;
  static readonly LOOKBACK_DAYS = 400;
  private static readonly YEAR_DAYS = 365;

  /**
   * Merges live quote and market depth feeds into normalized stock vitals.
   */
  static buildVitals(
    quote: MarketQuote | null,
    depth: Partial<MarketQuote> | null
  ): StockVitals {
    const liveQuote = quote && quote.ltp > 0 ? quote : null;
    const ltp = liveQuote ? liveQuote.ltp : (depth?.ltp ?? quote?.ltp ?? 0);

    return {
      ltp,
      change: liveQuote ? liveQuote.change : (depth?.change ?? quote?.change ?? 0),
      changePercent: liveQuote
        ? liveQuote.changePercent
        : (depth?.changePercent ?? quote?.changePercent ?? 0),
      open:
        liveQuote && liveQuote.open > 0
          ? liveQuote.open
          : (depth?.open ?? quote?.open ?? 0),
      high:
        liveQuote && liveQuote.high > 0
          ? liveQuote.high
          : (depth?.high ?? quote?.high ?? 0),
      low:
        liveQuote && liveQuote.low > 0
          ? liveQuote.low
          : (depth?.low ?? quote?.low ?? 0),
      close:
        liveQuote && liveQuote.close > 0
          ? liveQuote.close
          : (depth?.close ?? quote?.close ?? 0),
      volume: liveQuote ? liveQuote.volume : (depth?.volume ?? quote?.volume ?? 0),
      atp: depth?.atp ?? quote?.atp ?? ltp,
      lowerCircuit: depth?.lowerCircuit ?? quote?.lowerCircuit ?? null,
      upperCircuit: depth?.upperCircuit ?? quote?.upperCircuit ?? null,
      totalBuyQty: depth?.totalBuyQty ?? quote?.totalBuyQty ?? null,
      totalSellQty: depth?.totalSellQty ?? quote?.totalSellQty ?? null,
      bidPrice: depth?.bidPrice ?? quote?.bidPrice ?? null,
      askPrice: depth?.askPrice ?? quote?.askPrice ?? null,
    };
  }

  /**
   * Converts a UTC millisecond timestamp into an IST calendar date key (YYYY-MM-DD).
   */
  static toIstDateKey(tsMs: number): string {
    return new Date(tsMs + this.IST_OFFSET_MS).toISOString().slice(0, 10);
  }

  /**
   * Builds fallback overview stats when historical candles are unavailable.
   */
  static buildDefaultStats(vitals: StockVitals): StockOverviewStats {
    return {
      range52W: {
        high: vitals.high > 0 ? vitals.high : vitals.ltp,
        low: vitals.low > 0 ? vitals.low : vitals.ltp,
      },
      anchors: {
        oneDay: vitals.close > 0 ? vitals.close : null,
        oneWeek: null,
        oneMonth: null,
        threeMonths: null,
        sixMonths: null,
        ytd: null,
        oneYear: null,
      },
      fallbackClose: null,
    };
  }

  /**
   * Computes 52-week range, performance anchors, and fallback close from historical daily candles.
   */
  static calculateStatsFromCandles(
    candles: Candle[],
    vitals: StockVitals,
    nowMs: number
  ): StockOverviewStats {
    if (candles.length === 0) {
      return this.buildDefaultStats(vitals);
    }

    const todayIstKey = this.toIstDateKey(nowMs);
    const oneYearCutoff = nowMs - this.YEAR_DAYS * this.DAY_MS;
    const yearCandles = candles.filter((c) => c.timestamp >= oneYearCutoff);
    const statsCandles = yearCandles.length > 0 ? yearCandles : candles;

    const highs = statsCandles.map((c) => c.high);
    const lows = statsCandles.map((c) => c.low).filter((v) => v > 0);

    if (vitals.high > 0) highs.push(vitals.high);
    if (vitals.ltp > 0) highs.push(vitals.ltp);
    if (vitals.low > 0) lows.push(vitals.low);
    if (vitals.ltp > 0) lows.push(vitals.ltp);

    const defaults = this.buildDefaultStats(vitals);
    const range52W: StockRange52W = {
      high: highs.length > 0 ? +Math.max(...highs).toFixed(2) : defaults.range52W.high,
      low: lows.length > 0 ? +Math.min(...lows).toFixed(2) : defaults.range52W.low,
    };

    const anchors = this.resolveAnchors(candles, todayIstKey, vitals);
    const latestCandle = candles[candles.length - 1];
    const fallbackClose =
      latestCandle && latestCandle.close > 0 ? latestCandle.close : null;

    return {
      range52W,
      anchors,
      fallbackClose,
    };
  }

  /**
   * Combines cached or freshly computed baseline stats with live intraday vitals.
   */
  static applyLiveVitalsToStats(
    stats: StockOverviewStats,
    vitals: StockVitals
  ): { range52W: StockRange52W; performance: StockPerformanceReturns } {
    const dynamicHigh = Math.max(stats.range52W.high, vitals.high, vitals.ltp);
    const lowCandidates = [stats.range52W.low, vitals.low, vitals.ltp].filter((v) => v > 0);
    const dynamicLow =
      lowCandidates.length > 0 ? Math.min(...lowCandidates) : stats.range52W.low;

    const effectiveAnchors: StockPerformanceAnchors = {
      ...stats.anchors,
      oneDay: vitals.close > 0 ? vitals.close : stats.anchors.oneDay,
    };
    const currentPrice = vitals.ltp > 0 ? vitals.ltp : (stats.fallbackClose ?? 0);

    return {
      range52W: {
        high: +dynamicHigh.toFixed(2),
        low: +dynamicLow.toFixed(2),
      },
      performance: this.computePerformance(currentPrice, effectiveAnchors),
    };
  }

  private static resolveAnchors(
    candles: Candle[],
    todayIstKey: string,
    vitals: StockVitals
  ): StockPerformanceAnchors {
    const datedCandles = candles
      .filter((c) => c.close > 0)
      .map((c) => ({ dateKey: this.toIstDateKey(c.timestamp), close: c.close }))
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
      oneWeek: findOnOrBefore(this.subtractCalendarDays(todayIstKey, 7)),
      oneMonth: findOnOrBefore(this.subtractCalendarDays(todayIstKey, 30)),
      threeMonths: findOnOrBefore(this.subtractCalendarDays(todayIstKey, 90)),
      sixMonths: findOnOrBefore(this.subtractCalendarDays(todayIstKey, 180)),
      ytd: findOnOrBefore(prevYearEndKey),
      oneYear: findOnOrBefore(this.subtractCalendarDays(todayIstKey, 365)),
    };
  }

  private static computePerformance(
    currentPrice: number,
    anchors: StockPerformanceAnchors
  ): StockPerformanceReturns {
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

  private static computeReturnPercent(
    currentPrice: number,
    anchorClose: number | null
  ): number | null {
    if (currentPrice <= 0 || !anchorClose || anchorClose <= 0) {
      return null;
    }
    return +(((currentPrice - anchorClose) / anchorClose) * 100).toFixed(2);
  }

  private static subtractCalendarDays(dateKey: string, days: number): string {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().slice(0, 10);
  }
}
