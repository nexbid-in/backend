import { IBrokerAuthService } from "../../../application/interface/services/IBrokerAuthService";
import { ILogger } from "../../../application/interface/services/ILogger";
import {
  IMarketDataService,
  SymbolVerificationResult,
} from "../../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../../application/interface/services/IMarketSymbolRegistry";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketQuote } from "../../../domain/entities/market/MarketQuote";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketTickCache } from "./MarketTickCache";
import { FyersHistoricalCandleClient } from "./fyers/FyersHistoricalCandleClient";
import { FyersMarketDepthClient } from "./fyers/FyersMarketDepthClient";
import { FyersStreamClient } from "./fyers/FyersStreamClient";
import { FyersSymbolVerifier } from "./fyers/FyersSymbolVerifier";

/**
 * Facade composing specialized Fyers market stream, quote, depth, candle, and verification clients.
 */
export class FyersMarketService implements IMarketDataService {
  private readonly tickCache: MarketTickCache;
  private readonly streamClient: FyersStreamClient;
  private readonly historicalClient: FyersHistoricalCandleClient;
  private readonly symbolVerifier: FyersSymbolVerifier;
  private readonly depthClient: FyersMarketDepthClient;

  constructor(
    brokerAuthService: IBrokerAuthService,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    logger: ILogger
  ) {
    this.tickCache = new MarketTickCache();
    this.streamClient = new FyersStreamClient(
      brokerAuthService,
      symbolRegistry,
      this.tickCache,
      logger
    );
    this.historicalClient = new FyersHistoricalCandleClient(
      brokerAuthService,
      symbolRegistry,
      this.tickCache,
      logger
    );
    this.symbolVerifier = new FyersSymbolVerifier(
      brokerAuthService,
      symbolRegistry,
      this.tickCache
    );
    this.depthClient = new FyersMarketDepthClient(
      brokerAuthService,
      symbolRegistry,
      this.tickCache,
      logger
    );
  }

  getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    return this.historicalClient.getHistoricalCandles(
      symbol,
      resolution,
      from,
      to
    );
  }

  getQuote(symbol: string): Promise<MarketQuote | null> {
    const clean = this.symbolRegistry.fromFeedSymbol(symbol.toUpperCase().trim());
    return Promise.resolve(this.tickCache.toQuote(clean));
  }

  verifySymbol(symbol: string): Promise<SymbolVerificationResult> {
    return this.symbolVerifier.verifySymbol(symbol);
  }

  getMarketDepth(symbol: string): Promise<Partial<MarketQuote> | null> {
    return this.depthClient.getMarketDepth(symbol);
  }

  subscribe(symbols: string[]): Promise<void> {
    return this.streamClient.subscribe(symbols);
  }

  unsubscribe(symbols: string[]): Promise<void> {
    return this.streamClient.unsubscribe(symbols);
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.streamClient.onTick(callback);
  }
}
