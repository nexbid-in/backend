import { MarketQuote } from "../../../domain/entities/market/MarketQuote";
import { IMarketQuoteReader } from "../../interface/services/IMarketDataService";

/**
 * Application service responsible for deduplicating symbols and concurrently
 * fetching live market quotes in a single batch.
 */
export class MarketQuoteBatchService {
  constructor(private readonly quoteReader: IMarketQuoteReader) {}

  async fetchQuotes(
    symbols: Iterable<string>
  ): Promise<Map<string, MarketQuote | null>> {
    const uniqueSymbols = Array.from(new Set(symbols));
    const quotesBySymbol = new Map<string, MarketQuote | null>();

    if (uniqueSymbols.length === 0) {
      return quotesBySymbol;
    }

    const entries = await Promise.all(
      uniqueSymbols.map(async (symbol) => {
        const quote = await this.quoteReader.getQuote(symbol);
        return [symbol, quote] as const;
      })
    );

    for (const [symbol, quote] of entries) {
      quotesBySymbol.set(symbol, quote);
    }

    return quotesBySymbol;
  }
}
