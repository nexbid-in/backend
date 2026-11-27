import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { DeleteStockDTO } from "../../dto/admin/AdminStockDTOs";
import { IMarketSymbolRegistry } from "../../interface/services/IMarketSymbolRegistry";
import { IDeleteStockUseCase } from "../../interface/use-cases/admin/IDeleteStockUseCase";

/**
 * Orchestrates deleting an unused instrument and unregistering its feed mapping.
 */
export class DeleteStockUseCase implements IDeleteStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly symbolRegistry: IMarketSymbolRegistry
  ) {}

  async execute(dto: DeleteStockDTO): Promise<void> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    const orderCount = await this.stockRepo.countOrdersByStockId(stock.id);
    if (orderCount > 0) {
      throw new AppError(ErrorCodes.CANNOT_DELETE_STOCK_WITH_ORDERS);
    }

    await this.stockRepo.delete(stock.id);
    this.symbolRegistry.unregister(stock.symbol);
  }
}
