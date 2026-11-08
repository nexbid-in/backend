import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketQuote } from "../../../domain/entities/market/MarketQuote";
import { MarketSymbolMapper } from "./MarketSymbolMapper";

interface MockSymbolState {
  symbol: string;
  isIndex: boolean;
  basePrice: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  ltp: number;
  volume: number;
  cumulativeTradedValue: number;
  totalBuyQty: number;
  totalSellQty: number;
  lastUpdated: number;
}

// Realistic baseline prices for benchmark indices and seeded stocks
const BASELINE_PRICES: Record<string, number> = {
  // Indices
  "NIFTY 50": 24500,
  "NIFTY50": 24500,
  "BANKNIFTY": 52000,
  "NIFTY BANK": 52000,
  "SENSEX": 80000,
  "NIFTY IT": 42000,
  "NIFTY AUTO": 25000,
  "NIFTY PHARMA": 22000,
  "NIFTY METAL": 9500,
  "NIFTY FMCG": 60000,
  "NIFTY MIDCAP 50": 16000,

  // Equities
  RELIANCE: 1285,
  TCS: 4150,
  HDFCBANK: 1750,
  INFY: 1850,
  ICICIBANK: 1280,
  SBIN: 820,
  BHARTIARTL: 1600,
  KOTAKBANK: 1780,
  AXISBANK: 1190,
  LT: 3550,
  ITC: 470,
  HINDUNILVR: 2380,
  BAJFINANCE: 7100,
  TATAMOTORS: 404,
  TMCV: 404,
  TMPV: 276,
  TATASTEEL: 150,
  ZOMATO: 260,
  ETERNAL: 260,
  MRF: 135000,
  PAYTM: 810,
  NYKAA: 180,
  DELHIVERY: 380,
};

export class MockMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private activeSubscriptions = new Set<string>();
  private symbolStates = new Map<string, MockSymbolState>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMockTickGenerator();
  }

  private cleanSymbol(symbol: string): string {
    return MarketSymbolMapper.fromFyersSymbol(symbol.toUpperCase().trim());
  }

  private isIndex(cleanSymbol: string): boolean {
    const fyersSymbol = MarketSymbolMapper.toFyersSymbol(cleanSymbol);
    return fyersSymbol.includes("-INDEX");
  }

  private getOrInitState(cleanSymbol: string): MockSymbolState {
    let state = this.symbolStates.get(cleanSymbol);
    if (state) return state;

    const isIdx = this.isIndex(cleanSymbol);

    // Look up baseline price or generate a stable deterministic price based on symbol hash
    let base = BASELINE_PRICES[cleanSymbol];
    if (!base) {
      let hash = 0;
      for (let i = 0; i < cleanSymbol.length; i++) {
        hash = (hash << 5) - hash + cleanSymbol.charCodeAt(i);
        hash |= 0;
      }
      base = isIdx ? 20000 : 200 + Math.abs(hash % 2800);
    }

    // Previous day close within +/- 1.5% of baseline
    const prevClose = +(base * (1 + (Math.random() - 0.5) * 0.03)).toFixed(2);
    // Today's open within +/- 0.5% of prevClose
    const open = +(prevClose * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2);
    const ltp = open;
    const high = open;
    const low = open;
    const initialVolume = isIdx ? 0 : Math.floor(Math.random() * 500000) + 100000;

    state = {
      symbol: cleanSymbol,
      isIndex: isIdx,
      basePrice: base,
      prevClose,
      open,
      high,
      low,
      ltp,
      volume: initialVolume,
      cumulativeTradedValue: initialVolume * open,
      totalBuyQty: isIdx ? 0 : 450000,
      totalSellQty: isIdx ? 0 : 480000,
      lastUpdated: Date.now(),
    };

    this.symbolStates.set(cleanSymbol, state);
    return state;
  }

  private buildTickFromState(state: MockSymbolState): MarketTick {
    const change = +(state.ltp - state.prevClose).toFixed(2);
    const changePercent =
      state.prevClose > 0
        ? +(((state.ltp - state.prevClose) / state.prevClose) * 100).toFixed(2)
        : 0;
    const atp =
      state.volume > 0
        ? +(state.cumulativeTradedValue / state.volume).toFixed(2)
        : state.ltp;

    return {
      symbol: state.symbol,
      ltp: state.ltp,
      open: state.open,
      high: state.high,
      low: state.low,
      close: state.prevClose,
      change,
      changePercent,
      volume: state.volume,
      timestamp: state.lastUpdated,
      atp,
      bidPrice: state.isIndex ? null : +(state.ltp - 0.05).toFixed(2),
      askPrice: state.isIndex ? null : +(state.ltp + 0.05).toFixed(2),
      totalBuyQty: state.isIndex ? null : state.totalBuyQty,
      totalSellQty: state.isIndex ? null : state.totalSellQty,
    };
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const clean = this.cleanSymbol(symbol);
    const state = this.getOrInitState(clean);

    const isEOD = ["D", "1D", "W", "1W", "M", "1M"].includes(resolution);
    const intervalMs = isEOD
      ? 86400000
      : (parseInt(resolution, 10) || 15) * 60000;

    const candles: Candle[] = [];
    const targetBase = state.basePrice;
    let basePrice = targetBase;

    for (let time = from; time < to; time += intervalMs) {
      // Mean-reversion random walk
      const meanReversion = (targetBase - basePrice) * 0.02;
      const noise = (Math.random() - 0.5) * (targetBase * 0.004);
      const delta = meanReversion + noise;

      const open = Math.round(basePrice * 100) / 100;
      const close = Math.round((basePrice + delta) * 100) / 100;
      const high = Math.round((Math.max(open, close) + Math.random() * (targetBase * 0.002)) * 100) / 100;
      const low = Math.round((Math.min(open, close) - Math.random() * (targetBase * 0.002)) * 100) / 100;
      const volume = state.isIndex ? 0 : Math.floor(Math.random() * 50000) + 5000;

      candles.push({ timestamp: time, open, high, low, close, volume });
      basePrice = close;
    }

    // Seamlessly attach today's live state as the last candle
    if (candles.length > 0) {
      const last = candles[candles.length - 1];
      last.close = state.ltp;
      last.high = Math.max(last.high, state.high);
      last.low = Math.min(last.low, state.low);
    }

    return Promise.resolve(candles);
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    const clean = this.cleanSymbol(symbol);
    const state = this.getOrInitState(clean);
    const tick = this.buildTickFromState(state);

    return Promise.resolve({
      ...tick,
      atp: tick.atp ?? tick.ltp,
      lowerCircuit: state.isIndex ? null : +(state.prevClose * 0.9).toFixed(2),
      upperCircuit: state.isIndex ? null : +(state.prevClose * 1.1).toFixed(2),
      totalBuyQty: tick.totalBuyQty ?? null,
      totalSellQty: tick.totalSellQty ?? null,
      bidPrice: tick.bidPrice ?? null,
      askPrice: tick.askPrice ?? null,
    });
  }

  async getMarketDepth(symbol: string): Promise<Partial<MarketQuote> | null> {
    const clean = this.cleanSymbol(symbol);
    if (this.isIndex(clean)) {
      return Promise.resolve(null);
    }

    const state = this.getOrInitState(clean);
    const tick = this.buildTickFromState(state);

    return Promise.resolve({
      atp: tick.atp ?? tick.ltp,
      lowerCircuit: +(state.prevClose * 0.9).toFixed(2),
      upperCircuit: +(state.prevClose * 1.1).toFixed(2),
      totalBuyQty: state.totalBuyQty,
      totalSellQty: state.totalSellQty,
      bidPrice: tick.bidPrice ?? null,
      askPrice: tick.askPrice ?? null,
    });
  }

  async subscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => {
      const clean = this.cleanSymbol(s);
      this.activeSubscriptions.add(clean);
      this.getOrInitState(clean);
    });
    return Promise.resolve();
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => {
      const clean = this.cleanSymbol(s);
      this.activeSubscriptions.delete(clean);
    });
    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }

  private startMockTickGenerator() {
    this.timer = setInterval(() => {
      if (this.activeSubscriptions.size === 0) return;

      this.activeSubscriptions.forEach((cleanSymbol) => {
        const state = this.symbolStates.get(cleanSymbol);
        if (!state) return;

        // Realistic tick price step: +/- 0.05% fluctuation with gentle mean reversion to basePrice
        const meanPull = (state.basePrice - state.ltp) * 0.01;
        const tickNoise = (Math.random() - 0.5) * (state.basePrice * 0.001);
        const delta = +(meanPull + tickNoise).toFixed(2);

        let newLtp = +(state.ltp + delta).toFixed(2);
        if (newLtp <= 0) newLtp = state.ltp;

        // Update state maintaining OHLC and volume invariants
        state.ltp = newLtp;
        state.high = Math.max(state.high, newLtp);
        state.low = Math.min(state.low, newLtp);
        state.lastUpdated = Date.now();

        if (!state.isIndex) {
          const addedVolume = Math.floor(Math.random() * 50) + 5;
          state.volume += addedVolume;
          state.cumulativeTradedValue += addedVolume * newLtp;
          state.totalBuyQty = Math.max(1000, state.totalBuyQty + Math.floor((Math.random() - 0.5) * 200));
          state.totalSellQty = Math.max(1000, state.totalSellQty + Math.floor((Math.random() - 0.5) * 200));
        }

        const tick = this.buildTickFromState(state);
        this.tickCallbacks.forEach((cb) => cb(tick));
      });
    }, 1000);
  }
}
