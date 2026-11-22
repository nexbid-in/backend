import { InstrumentType } from "../../../domain/entities/Stock";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import {
  UpdateStockDTO,
  AdminStockItemDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IUpdateStockUseCase } from "../../interface/use-cases/admin/IUpdateStockUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { MarketSymbolMapper } from "../../../infrastructure/external/market/MarketSymbolMapper";

export class UpdateStockUseCase implements IUpdateStockUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(dto: UpdateStockDTO): Promise<AdminStockItemDTO> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND, "Stock not found");
    }

    const newFeedSymbol =
      dto.feedSymbol !== undefined
        ? dto.feedSymbol?.toUpperCase().trim() || null
        : undefined;

    if (newFeedSymbol && newFeedSymbol !== stock.feedSymbol) {
      const existingFeed = await this.stockRepo.findByFeedSymbol(newFeedSymbol);
      if (existingFeed && existingFeed.id !== stock.id) {
        throw new AppError(
          ErrorCodes.STOCK_FEED_SYMBOL_ALREADY_EXISTS,
          "This feed symbol is already mapped to another instrument."
        );
      }
    }

    if (stock.feedSymbol) {
      MarketSymbolMapper.unregister(stock.symbol);
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
      MarketSymbolMapper.register(updated.symbol, updated.feedSymbol);
    }

    const orderCount = await this.stockRepo.countOrdersByStockId(updated.id);

    return {
      id: updated.id,
      symbol: updated.symbol,
      name: updated.name,
      exchange: updated.exchange,
      sector: updated.sector,
      type: updated.type,
      feedSymbol: updated.feedSymbol,
      isActive: updated.isActive,
      isTradable: updated.isTradable,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      orderCount,
    };
  }
}
