import { MarketQuote } from "../../../domain/entities/market/MarketQuote";
import { IMarketDataService } from "../../interface/services/IMarketDataService";

/**
 * Application service responsible for deduplicating symbols and concurrently
 * fetching live market quotes in a single batch.
 */
export class MarketQuoteBatchService {
  constructor(private readonly marketDataService: IMarketDataService) {}

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
        const quote = await this.marketDataService.getQuote(symbol);
        return [symbol, quote] as const;
      })
    );

    for (const [symbol, quote] of entries) {
      quotesBySymbol.set(symbol, quote);
    }

    return quotesBySymbol;
  }
}
