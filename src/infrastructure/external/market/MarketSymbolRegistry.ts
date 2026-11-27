import { IMarketSymbolRegistry } from "../../../application/interface/services/IMarketSymbolRegistry";
import { MarketSymbolMapper } from "./MarketSymbolMapper";

/**
 * Infrastructure adapter delegating symbol registry operations to MarketSymbolMapper.
 */
export class MarketSymbolRegistry implements IMarketSymbolRegistry {
  register(symbol: string, feedSymbol: string): void {
    MarketSymbolMapper.register(symbol, feedSymbol);
  }

  unregister(symbol: string): void {
    MarketSymbolMapper.unregister(symbol);
  }

  toFeedSymbol(symbol: string): string {
    return MarketSymbolMapper.toFeedSymbol(symbol);
  }
}
