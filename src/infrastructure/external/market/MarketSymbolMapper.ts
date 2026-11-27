/**
 * Stateful bi-directional symbol mapper converting between internal instrument symbols
 * and exchange/broker feed symbols.
 */
export class MarketSymbolMapper {
  private readonly symbolToFeedMap = new Map<string, string>();
  private readonly feedToSymbolMap = new Map<string, string>();

  init(stocks: Array<{ symbol: string; feedSymbol?: string | null }>): void {
    this.symbolToFeedMap.clear();
    this.feedToSymbolMap.clear();

    for (const stock of stocks) {
      if (stock.feedSymbol) {
        this.register(stock.symbol, stock.feedSymbol);
      }
    }
  }

  register(symbol: string, feedSymbol: string): void {
    const cleanSym = symbol.toUpperCase().trim();
    const cleanFeed = feedSymbol.toUpperCase().trim();
    const spacelessSym = cleanSym.replace(/\s+/g, "");

    this.symbolToFeedMap.set(cleanSym, cleanFeed);
    this.symbolToFeedMap.set(spacelessSym, cleanFeed);
    this.feedToSymbolMap.set(cleanFeed, cleanSym);
  }

  unregister(symbol: string): void {
    const cleanSym = symbol.toUpperCase().trim();
    const spacelessSym = cleanSym.replace(/\s+/g, "");

    const feedSymbol =
      this.symbolToFeedMap.get(cleanSym) ||
      this.symbolToFeedMap.get(spacelessSym);
    if (feedSymbol) {
      this.feedToSymbolMap.delete(feedSymbol);
    }

    this.symbolToFeedMap.delete(cleanSym);
    this.symbolToFeedMap.delete(spacelessSym);
  }

  toFeedSymbol(symbol: string): string {
    const raw = symbol.toUpperCase().trim();

    if (this.symbolToFeedMap.has(raw)) {
      return this.symbolToFeedMap.get(raw)!;
    }

    const spaceless = raw.replace(/\s+/g, "");
    if (this.symbolToFeedMap.has(spaceless)) {
      return this.symbolToFeedMap.get(spaceless)!;
    }

    if (raw.startsWith("NSE:") || raw.startsWith("BSE:")) {
      const cleanBase = raw
        .replace(/^(NSE|BSE):/, "")
        .replace(/-EQ$/, "")
        .replace(/-INDEX$/, "");
      if (this.symbolToFeedMap.has(cleanBase)) {
        return this.symbolToFeedMap.get(cleanBase)!;
      }
      return raw;
    }

    return `NSE:${spaceless}-EQ`;
  }

  fromFeedSymbol(feedSymbol: string): string {
    const raw = feedSymbol.trim();
    const upper = raw.toUpperCase();

    if (this.feedToSymbolMap.has(upper)) {
      return this.feedToSymbolMap.get(upper)!;
    }
    if (this.feedToSymbolMap.has(raw)) {
      return this.feedToSymbolMap.get(raw)!;
    }

    return upper
      .replace(/^(NSE|BSE):/, "")
      .replace(/-EQ$/, "")
      .replace(/-INDEX$/, "");
  }
}
