import { MarketQuote } from "../../../domain/entities/market/MarketQuote";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

/**
 * In-memory latest tick store shared across market quote readers, depth fetchers, and stream clients.
 */
export class MarketTickCache {
  private readonly latestTicks = new Map<string, MarketTick>();

  get(symbol: string): MarketTick | undefined {
    return this.latestTicks.get(symbol);
  }

  has(symbol: string): boolean {
    return this.latestTicks.has(symbol);
  }

  set(symbol: string, tick: MarketTick): void {
    this.latestTicks.set(symbol, tick);
  }

  setIfAbsent(symbol: string, tick: MarketTick): void {
    if (!this.latestTicks.has(symbol)) {
      this.latestTicks.set(symbol, tick);
    }
  }

  toQuote(symbol: string): MarketQuote | null {
    const liveTick = this.latestTicks.get(symbol);
    if (!liveTick) {
      return null;
    }

    return {
      symbol,
      ltp: liveTick.ltp,
      open: liveTick.open,
      high: liveTick.high,
      low: liveTick.low,
      close: liveTick.close,
      change: liveTick.change,
      changePercent: liveTick.changePercent,
      volume: liveTick.volume,
      atp: liveTick.atp ?? liveTick.ltp,
      lowerCircuit: null,
      upperCircuit: null,
      totalBuyQty: liveTick.totalBuyQty ?? null,
      totalSellQty: liveTick.totalSellQty ?? null,
      bidPrice: liveTick.bidPrice ?? null,
      askPrice: liveTick.askPrice ?? null,
      timestamp: liveTick.timestamp,
    };
  }
}
