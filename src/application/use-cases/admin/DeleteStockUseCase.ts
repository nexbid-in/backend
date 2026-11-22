import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { DeleteStockDTO } from "../../dto/admin/AdminStockDTOs";
import { IDeleteStockUseCase } from "../../interface/use-cases/admin/IDeleteStockUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { MarketSymbolMapper } from "../../../infrastructure/external/market/MarketSymbolMapper";

export class DeleteStockUseCase implements IDeleteStockUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(dto: DeleteStockDTO): Promise<void> {
    const stock = await this.stockRepo.findById(dto.stockId);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND, "Stock not found");
    }

    const orderCount = await this.stockRepo.countOrdersByStockId(stock.id);
    if (orderCount > 0) {
      throw new AppError(
        ErrorCodes.CANNOT_DELETE_STOCK_WITH_ORDERS,
        "Cannot delete instrument with associated orders or trades. Deactivate it instead."
      );
    }

    await this.stockRepo.delete(stock.id);
    MarketSymbolMapper.unregister(stock.symbol);
  }
}
