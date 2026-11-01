import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

export interface IMarketDataService {
    getHistoricalCandles(
        symbol: string,
        resolution: string,
        from: number,
        to: number
    ): Promise<Candle[]>;

    getQuote(symbol: string): Promise<MarketTick | null>;

    subscribe(symbols: string[]): Promise<void>;
    unsubscribe(symbols: string[]): Promise<void>;

    onTick(callback: (tick: MarketTick) => void): void;
}