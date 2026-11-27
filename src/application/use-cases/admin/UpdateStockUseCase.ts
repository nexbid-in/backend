import { InstrumentType } from "../../../domain/entities/Stock";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  AdminStockItemDTO,
  UpdateStockDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IMarketSymbolRegistry } from "../../interface/services/IMarketSymbolRegistry";
import { IUpdateStockUseCase } from "../../interface/use-cases/admin/IUpdateStockUseCase";
import { AdminStockDTOMapper } from "../../mapper/admin/AdminStockDTOMapper";
import { StockFeedVerificationService } from "../../services/admin/StockFeedVerificationService";

/**
 * Orchestrates instrument metadata updates, feed verification, symbol registry sync,
 * and DTO mapping.
 */
export class UpdateStockUseCase implements IUpdateStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly feedVerificationService: StockFeedVerificationService,
    private readonly symbolRegistry: IMarketSymbolRegistry
  ) {}

  async execute(dto: UpdateStockDTO): Promise<AdminStockItemDTO> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    const newFeedSymbol =
      dto.feedSymbol !== undefined
        ? dto.feedSymbol?.toUpperCase().trim() || null
        : undefined;

    if (newFeedSymbol && newFeedSymbol !== stock.feedSymbol) {
      await this.feedVerificationService.assertUniqueFeedSymbol(
        newFeedSymbol,
        stock.id
      );
      await this.feedVerificationService.assertValidFeedSymbol(
        stock.symbol,
        newFeedSymbol
      );
    }

    if (stock.feedSymbol) {
      this.symbolRegistry.unregister(stock.symbol);
    }

    stock.updateMetadata({
      name: dto.name?.trim(),
      exchange: dto.exchange?.toUpperCase().trim(),
      sector: dto.sector !== undefined ? dto.sector?.trim() || null : undefined,
      type: dto.type,
      feedSymbol: newFeedSymbol,
    });

    if (stock.type === InstrumentType.INDEX && stock.isTradable) {
      stock.updateStatus(undefined, false);
    }

    const updated = await this.stockRepo.update(stock);

    if (updated.feedSymbol) {
      this.symbolRegistry.register(updated.symbol, updated.feedSymbol);
    }

    const orderCount = await this.stockRepo.countOrdersByStockId(updated.id);

    return AdminStockDTOMapper.toItemDTO(updated, orderCount === 0);
  }
}
