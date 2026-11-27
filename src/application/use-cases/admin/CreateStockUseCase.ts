import { Stock } from "../../../domain/entities/Stock";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  AdminStockItemDTO,
  CreateStockDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IMarketSymbolRegistry } from "../../interface/services/IMarketSymbolRegistry";
import { ICreateStockUseCase } from "../../interface/use-cases/admin/ICreateStockUseCase";
import { AdminStockDTOMapper } from "../../mapper/admin/AdminStockDTOMapper";
import { StockFeedVerificationService } from "../../services/admin/StockFeedVerificationService";

/**
 * Orchestrates instrument creation, uniqueness/feed validation, persistence,
 * symbol registry registration, and DTO mapping.
 */
export class CreateStockUseCase implements ICreateStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly feedVerificationService: StockFeedVerificationService,
    private readonly symbolRegistry: IMarketSymbolRegistry
  ) {}

  async execute(dto: CreateStockDTO): Promise<AdminStockItemDTO> {
    const symbol = dto.symbol.toUpperCase().trim();
    const existing = await this.stockRepo.findBySymbol(symbol);
    if (existing) {
      throw new AppError(ErrorCodes.STOCK_SYMBOL_ALREADY_EXISTS);
    }

    const feedSymbol = dto.feedSymbol?.toUpperCase().trim() || null;
    if (feedSymbol) {
      await this.feedVerificationService.assertUniqueFeedSymbol(feedSymbol);
    }

    await this.feedVerificationService.assertValidFeedSymbol(symbol, feedSymbol);

    const stock = Stock.create({
      symbol,
      name: dto.name.trim(),
      exchange: dto.exchange?.toUpperCase().trim() || "NSE",
      sector: dto.sector?.trim() || null,
      type: dto.type,
      feedSymbol,
      isActive: dto.isActive ?? true,
      isTradable: dto.isTradable,
    });

    const saved = await this.stockRepo.save(stock);

    if (saved.feedSymbol) {
      this.symbolRegistry.register(saved.symbol, saved.feedSymbol);
    }

    return AdminStockDTOMapper.toItemDTO(saved, true);
  }
}
