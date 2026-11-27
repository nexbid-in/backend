/**
 * Port for managing and resolving broker feed symbol mappings without coupling
 * application use cases to concrete infrastructure symbol maps.
 */
export interface IMarketSymbolRegistry {
  register(symbol: string, feedSymbol: string): void;
  unregister(symbol: string): void;
  toFeedSymbol(symbol: string): string;
}
