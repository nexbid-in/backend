/**
 * Port for managing and resolving broker feed symbol mappings without coupling
 * application or infrastructure consumers to static symbol maps.
 */
export interface IMarketSymbolRegistry {
  init(stocks: Array<{ symbol: string; feedSymbol?: string | null }>): void;
  register(symbol: string, feedSymbol: string): void;
  unregister(symbol: string): void;
  toFeedSymbol(symbol: string): string;
  fromFeedSymbol(feedSymbol: string): string;
}
