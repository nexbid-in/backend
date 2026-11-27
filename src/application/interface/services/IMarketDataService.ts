import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketQuote } from "../../../domain/entities/market/MarketQuote";

export interface SymbolVerificationResult {
  valid: boolean;
  ltp?: number;
  description?: string;
  exchange?: string;
}

export interface IMarketQuoteReader {
  getQuote(symbol: string): Promise<MarketQuote | null>;
}

export interface IMarketDepthReader {
  getMarketDepth(symbol: string): Promise<Partial<MarketQuote> | null>;
}

export interface IHistoricalMarketDataReader {
  getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]>;
}

export interface IMarketSymbolVerifier {
  verifySymbol(symbol: string): Promise<SymbolVerificationResult>;
}

export interface IMarketStreamService {
  subscribe(symbols: string[]): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;
  onTick(callback: (tick: MarketTick) => void): void;
}

export interface IMarketDataService
  extends IMarketQuoteReader,
    IMarketDepthReader,
    IHistoricalMarketDataReader,
    IMarketSymbolVerifier,
    IMarketStreamService {}