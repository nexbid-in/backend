import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

export class MockMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private activeSubscriptions = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMockTickGenerator();
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const candles: Candle[] = [];
    const intervalMs = resolution === "D" ? 86400000 : parseInt(resolution, 10) * 60000 || 900000;
    const targetBase = symbol.includes("NIFTY") ? 24500 : 2500;
    let basePrice = targetBase;

    for (let time = from; time <= to; time += intervalMs) {
      // Mean-reversion to keep historical walk continuous with live ticks
      const meanReversion = (targetBase - basePrice) * 0.02;
      const noise = (Math.random() - 0.5) * (targetBase * 0.003);
      const delta = meanReversion + noise;
      const open = Math.round(basePrice * 100) / 100;
      const close = Math.round((basePrice + delta) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.random() * (targetBase * 0.001)) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.random() * (targetBase * 0.001)) * 100) / 100;
      const volume = Math.floor(Math.random() * 50000) + 1000;

      candles.push({ timestamp: time, open, high, low, close, volume });
      basePrice = close;
    }
    return Promise.resolve(candles);
  }

  async getQuote(_symbol: string): Promise<MarketTick | null> {
    return Promise.resolve(null);
  }

  async subscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => this.activeSubscriptions.add(s));
    return Promise.resolve();
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => this.activeSubscriptions.delete(s));
    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }

  private startMockTickGenerator() {
    this.timer = setInterval(() => {
      if (this.activeSubscriptions.size === 0) return;

      this.activeSubscriptions.forEach((symbol) => {
        const ltp = +(2500 + (Math.random() - 0.5) * 10).toFixed(2);
        const tick: MarketTick = {
          symbol,
          ltp,
          open: 2490,
          high: 2515,
          low: 2480,
          close: 2495,
          change: +(ltp - 2495).toFixed(2),
          changePercent: +(((ltp - 2495) / 2495) * 100).toFixed(2),
          volume: Math.floor(Math.random() * 1000) + 10,
          timestamp: Date.now(),
        };

        this.tickCallbacks.forEach((cb) => cb(tick));
      });
    }, 1000);
  }
}
