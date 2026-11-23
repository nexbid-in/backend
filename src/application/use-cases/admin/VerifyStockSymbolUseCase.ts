import { IMarketDataService } from "../../interface/services/IMarketDataService";
import {
  VerifyStockSymbolDTO,
  VerifyStockSymbolResponseDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IVerifyStockSymbolUseCase } from "../../interface/use-cases/admin/IVerifyStockSymbolUseCase";
import { MarketSymbolMapper } from "../../../infrastructure/external/market/MarketSymbolMapper";

export class VerifyStockSymbolUseCase implements IVerifyStockSymbolUseCase {
  constructor(private readonly marketDataService: IMarketDataService) {}

  async execute(
    dto: VerifyStockSymbolDTO
  ): Promise<VerifyStockSymbolResponseDTO> {
    const symbol = dto.symbol.toUpperCase().trim();
    const resolvedFeedSymbol = dto.feedSymbol
      ? dto.feedSymbol.toUpperCase().trim()
      : MarketSymbolMapper.toFeedSymbol(symbol);

    if (this.marketDataService.verifySymbol) {
      const verification = await this.marketDataService.verifySymbol(
        resolvedFeedSymbol
      );

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

    return {
      valid: true,
      symbol,
      resolvedFeedSymbol,
      message: "Symbol accepted.",
    };
  }
}
