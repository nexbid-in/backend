import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  AdminStockItemDTO,
  UpdateStockStatusDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IUpdateStockStatusUseCase } from "../../interface/use-cases/admin/IUpdateStockStatusUseCase";
import { AdminStockDTOMapper } from "../../mapper/admin/AdminStockDTOMapper";

/**
 * Orchestrates toggling instrument active/tradable status and mapping the updated item.
 */
export class UpdateStockStatusUseCase implements IUpdateStockStatusUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(dto: UpdateStockStatusDTO): Promise<AdminStockItemDTO> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    stock.updateStatus(dto.isActive, dto.isTradable);
    const updated = await this.stockRepo.update(stock);
    const orderCount = await this.stockRepo.countOrdersByStockId(updated.id);

    return AdminStockDTOMapper.toItemDTO(updated, orderCount === 0);
  }
}
