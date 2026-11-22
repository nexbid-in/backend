import { InstrumentType } from "../../../domain/entities/Stock";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import {
  UpdateStockStatusDTO,
  AdminStockItemDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IUpdateStockStatusUseCase } from "../../interface/use-cases/admin/IUpdateStockStatusUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class UpdateStockStatusUseCase implements IUpdateStockStatusUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(dto: UpdateStockStatusDTO): Promise<AdminStockItemDTO> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND, "Stock not found");
    }

    if (stock.type === InstrumentType.INDEX && dto.isTradable === true) {
      throw new AppError(
        ErrorCodes.INDEX_CANNOT_BE_TRADABLE,
        "Indices cannot be configured as tradable instruments."
      );
    }

    stock.updateStatus(dto.isActive, dto.isTradable);
    const updated = await this.stockRepo.update(stock);
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
