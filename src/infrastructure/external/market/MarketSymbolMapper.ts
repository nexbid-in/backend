export class MarketSymbolMapper {
  static toFyersSymbol(symbol: string): string {
    const clean = symbol.toUpperCase().trim();
    if (clean === "NIFTY50" || clean === "NIFTY") return "NSE:NIFTY50-INDEX";
    if (clean === "BANKNIFTY") return "NSE:NIFTYBANK-INDEX";
    return `NSE:${clean}-EQ`;
  }

  static fromFyersSymbol(fyersSymbol: string): string {
    return fyersSymbol
      .replace("NSE:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "");
  }
}