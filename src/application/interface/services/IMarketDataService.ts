import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketQuote } from "../../../domain/entities/market/MarketQuote";

export interface IMarketDataService {
    getHistoricalCandles(
        symbol: string,
        resolution: string,
        from: number,
        to: number
    ): Promise<Candle[]>;

    getQuote(symbol: string): Promise<MarketQuote | null>;

    getMarketDepth?(symbol: string): Promise<Partial<MarketQuote> | null>;

    subscribe(symbols: string[]): Promise<void>;
    unsubscribe(symbols: string[]): Promise<void>;

    onTick(callback: (tick: MarketTick) => void): void;
}