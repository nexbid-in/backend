import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import {
  AdminStocksQueryDTO,
  PaginatedAdminStocksResponseDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IGetAdminStocksUseCase } from "../../interface/use-cases/admin/IGetAdminStocksUseCase";
import { AdminStockDTOMapper } from "../../mapper/admin/AdminStockDTOMapper";

/**
 * Orchestrates querying paginated admin stocks and projecting them to DTOs.
 */
export class GetAdminStocksUseCase implements IGetAdminStocksUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(
    query: AdminStocksQueryDTO
  ): Promise<PaginatedAdminStocksResponseDTO> {
    const { stocks, total, metrics, orderCounts } =
      await this.stockRepo.findAdminStocks({
        query: query.query,
        type: query.type,
        isActive: query.isActive,
        isTradable: query.isTradable,
        page: query.page,
        limit: query.limit,
      });

    return AdminStockDTOMapper.toPaginatedDTO({
      stocks,
      orderCounts,
      total,
      page: query.page,
      limit: query.limit,
      metrics,
    });
  }
}
