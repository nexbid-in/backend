const DEFAULT_INDEX_MAP: Record<string, string> = {
  "NIFTY 50": "NSE:NIFTY50-INDEX",
  "NIFTY50": "NSE:NIFTY50-INDEX",
  "NIFTY": "NSE:NIFTY50-INDEX",
  "BANKNIFTY": "NSE:NIFTYBANK-INDEX",
  "NIFTY BANK": "NSE:NIFTYBANK-INDEX",
  "NIFTY IT": "NSE:NIFTYIT-INDEX",
  "NIFTYIT": "NSE:NIFTYIT-INDEX",
  "NIFTY AUTO": "NSE:NIFTYAUTO-INDEX",
  "NIFTYAUTO": "NSE:NIFTYAUTO-INDEX",
  "NIFTY PHARMA": "NSE:NIFTYPHARMA-INDEX",
  "NIFTYPHARMA": "NSE:NIFTYPHARMA-INDEX",
  "NIFTY METAL": "NSE:NIFTYMETAL-INDEX",
  "NIFTYMETAL": "NSE:NIFTYMETAL-INDEX",
  "NIFTY FMCG": "NSE:NIFTYFMCG-INDEX",
  "NIFTYFMCG": "NSE:NIFTYFMCG-INDEX",
  "NIFTY MIDCAP 50": "NSE:NIFTYMIDCAP50-INDEX",
  "NIFTYMIDCAP50": "NSE:NIFTYMIDCAP50-INDEX",
  "SENSEX": "BSE:SENSEX-INDEX",
};

const DEFAULT_REVERSE_INDEX_MAP: Record<string, string> = {
  "NSE:NIFTY50-INDEX": "NIFTY 50",
  "NSE:NIFTYBANK-INDEX": "BANKNIFTY",
  "NSE:NIFTYIT-INDEX": "NIFTY IT",
  "NSE:NIFTYAUTO-INDEX": "NIFTY AUTO",
  "NSE:NIFTYPHARMA-INDEX": "NIFTY PHARMA",
  "NSE:NIFTYMETAL-INDEX": "NIFTY METAL",
  "NSE:NIFTYFMCG-INDEX": "NIFTY FMCG",
  "NSE:NIFTYMIDCAP50-INDEX": "NIFTY MIDCAP 50",
  "BSE:SENSEX-INDEX": "SENSEX",
};

export class MarketSymbolMapper {
  private static symbolToFeedMap = new Map<string, string>();
  private static feedToSymbolMap = new Map<string, string>();

  static init(stocks: Array<{ symbol: string; feedSymbol?: string | null }>): void {
    this.symbolToFeedMap.clear();
    this.feedToSymbolMap.clear();

    for (const [sym, feed] of Object.entries(DEFAULT_INDEX_MAP)) {
      this.symbolToFeedMap.set(sym.toUpperCase(), feed.toUpperCase());
    }
    for (const [feed, sym] of Object.entries(DEFAULT_REVERSE_INDEX_MAP)) {
      this.feedToSymbolMap.set(feed.toUpperCase(), sym.toUpperCase());
    }

    for (const stock of stocks) {
      if (stock.feedSymbol) {
        this.register(stock.symbol, stock.feedSymbol);
      }
    }
  }

  static register(symbol: string, feedSymbol: string): void {
    const cleanSym = symbol.toUpperCase().trim();
    const cleanFeed = feedSymbol.toUpperCase().trim();
    const spacelessSym = cleanSym.replace(/\s+/g, "");

    this.symbolToFeedMap.set(cleanSym, cleanFeed);
    this.symbolToFeedMap.set(spacelessSym, cleanFeed);
    this.feedToSymbolMap.set(cleanFeed, cleanSym);
  }

  static unregister(symbol: string): void {
    const cleanSym = symbol.toUpperCase().trim();
    const spacelessSym = cleanSym.replace(/\s+/g, "");

    const feedSymbol = this.symbolToFeedMap.get(cleanSym) || this.symbolToFeedMap.get(spacelessSym);
    if (feedSymbol) {
      this.feedToSymbolMap.delete(feedSymbol);
    }

    this.symbolToFeedMap.delete(cleanSym);
    this.symbolToFeedMap.delete(spacelessSym);
  }

  static toFeedSymbol(symbol: string): string {
    const raw = symbol.toUpperCase().trim();

    if (this.symbolToFeedMap.has(raw)) {
      return this.symbolToFeedMap.get(raw)!;
    }

    const spaceless = raw.replace(/\s+/g, "");
    if (this.symbolToFeedMap.has(spaceless)) {
      return this.symbolToFeedMap.get(spaceless)!;
    }

    if (raw.startsWith("NSE:") || raw.startsWith("BSE:")) {
      const cleanBase = raw.replace(/^(NSE|BSE):/, "").replace(/-EQ$/, "").replace(/-INDEX$/, "");
      if (this.symbolToFeedMap.has(cleanBase)) {
        return this.symbolToFeedMap.get(cleanBase)!;
      }
      return raw;
    }

    if (DEFAULT_INDEX_MAP[raw]) {
      return DEFAULT_INDEX_MAP[raw];
    }
    if (DEFAULT_INDEX_MAP[spaceless]) {
      return DEFAULT_INDEX_MAP[spaceless];
    }

    return `NSE:${spaceless}-EQ`;
  }

  static fromFeedSymbol(feedSymbol: string): string {
    const raw = feedSymbol.trim();
    const upper = raw.toUpperCase();

    if (this.feedToSymbolMap.has(upper)) {
      return this.feedToSymbolMap.get(upper)!;
    }
    if (this.feedToSymbolMap.has(raw)) {
      return this.feedToSymbolMap.get(raw)!;
    }

    if (DEFAULT_REVERSE_INDEX_MAP[upper]) {
      return DEFAULT_REVERSE_INDEX_MAP[upper];
    }
    if (DEFAULT_REVERSE_INDEX_MAP[raw]) {
      return DEFAULT_REVERSE_INDEX_MAP[raw];
    }

    return upper
      .replace(/^(NSE|BSE):/, "")
      .replace(/-EQ$/, "")
      .replace(/-INDEX$/, "");
  }

  static toFyersSymbol(symbol: string): string {
    return this.toFeedSymbol(symbol);
  }

  static fromFyersSymbol(fyersSymbol: string): string {
    return this.fromFeedSymbol(fyersSymbol);
  }
}
