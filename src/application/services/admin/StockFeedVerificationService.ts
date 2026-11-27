import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { VerifyStockSymbolResponseDTO } from "../../dto/admin/AdminStockDTOs";
import { IMarketSymbolVerifier } from "../../interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../interface/services/IMarketSymbolRegistry";

/**
 * Validates broker feed symbol uniqueness and verifies ticker availability
 * against the configured market symbol verifier.
 */
export class StockFeedVerificationService {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly symbolVerifier: IMarketSymbolVerifier,
    private readonly symbolRegistry: IMarketSymbolRegistry
  ) {}

  async assertUniqueFeedSymbol(
    feedSymbol: string,
    excludeStockId?: string
  ): Promise<void> {
    const existingFeed = await this.stockRepo.findByFeedSymbol(feedSymbol);
    if (existingFeed && existingFeed.id !== excludeStockId) {
      throw new AppError(ErrorCodes.STOCK_FEED_SYMBOL_ALREADY_EXISTS);
    }
  }

  async assertValidFeedSymbol(
    symbol: string,
    feedSymbol: string | null
  ): Promise<void> {
    const targetFeedSymbol = feedSymbol ?? this.symbolRegistry.toFeedSymbol(symbol);
    const verification = await this.symbolVerifier.verifySymbol(targetFeedSymbol);
    if (!verification.valid) {
      throw new AppError(ErrorCodes.INVALID_BROKER_FEED_SYMBOL);
    }
  }

  async verifyTicker(
    rawSymbol: string,
    rawFeedSymbol?: string | null
  ): Promise<VerifyStockSymbolResponseDTO> {
    const symbol = rawSymbol.toUpperCase().trim();
    const resolvedFeedSymbol = rawFeedSymbol
      ? rawFeedSymbol.toUpperCase().trim()
      : this.symbolRegistry.toFeedSymbol(symbol);

    const verification = await this.symbolVerifier.verifySymbol(resolvedFeedSymbol);

    if (!verification.valid) {
      return {
        valid: false,
        symbol,
        resolvedFeedSymbol,
        message: `Instrument ticker '${resolvedFeedSymbol}' was not recognized by the exchange feed. Please verify symbol spelling.`,
      };
    }

    return {
      valid: true,
      symbol,
      resolvedFeedSymbol,
      ltp: verification.ltp,
      description: verification.description,
      exchange: verification.exchange,
      message: "Instrument ticker verified successfully on exchange feed.",
    };
  }
}
