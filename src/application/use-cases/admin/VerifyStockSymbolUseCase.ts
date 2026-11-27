import {
  VerifyStockSymbolDTO,
  VerifyStockSymbolResponseDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IVerifyStockSymbolUseCase } from "../../interface/use-cases/admin/IVerifyStockSymbolUseCase";
import { StockFeedVerificationService } from "../../services/admin/StockFeedVerificationService";

/**
 * Orchestrates verifying an instrument ticker against the exchange market feed.
 */
export class VerifyStockSymbolUseCase implements IVerifyStockSymbolUseCase {
  constructor(
    private readonly feedVerificationService: StockFeedVerificationService
  ) {}

  async execute(
    dto: VerifyStockSymbolDTO
  ): Promise<VerifyStockSymbolResponseDTO> {
    return this.feedVerificationService.verifyTicker(
      dto.symbol,
      dto.feedSymbol
    );
  }
}
