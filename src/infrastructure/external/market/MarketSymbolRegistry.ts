import { IMarketSymbolRegistry } from "../../../application/interface/services/IMarketSymbolRegistry";
import { MarketSymbolMapper } from "./MarketSymbolMapper";

/**
 * Injectable infrastructure symbol registry backed by a dedicated MarketSymbolMapper instance.
 */
export class MarketSymbolRegistry implements IMarketSymbolRegistry {
  constructor(private readonly mapper: MarketSymbolMapper = new MarketSymbolMapper()) {}

  init(stocks: Array<{ symbol: string; feedSymbol?: string | null }>): void {
    this.mapper.init(stocks);
  }

  register(symbol: string, feedSymbol: string): void {
    this.mapper.register(symbol, feedSymbol);
  }

  unregister(symbol: string): void {
    this.mapper.unregister(symbol);
  }

  toFeedSymbol(symbol: string): string {
    return this.mapper.toFeedSymbol(symbol);
  }

  fromFeedSymbol(feedSymbol: string): string {
    return this.mapper.fromFeedSymbol(feedSymbol);
  }
}
