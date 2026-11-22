import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import {
  AdminStocksQueryDTO,
  PaginatedAdminStocksResponseDTO,
  AdminStockItemDTO,
} from "../../dto/admin/AdminStockDTOs";
import { IGetAdminStocksUseCase } from "../../interface/use-cases/admin/IGetAdminStocksUseCase";

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
        sector: query.sector,
        page: query.page,
        limit: query.limit,
      });

    const stockItems: AdminStockItemDTO[] = stocks.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      type: s.type,
      feedSymbol: s.feedSymbol,
      isActive: s.isActive,
      isTradable: s.isTradable,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      orderCount: orderCounts[s.id] || 0,
    }));

    return {
      stocks: stockItems,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalStocks: total,
        totalPages: Math.ceil(total / query.limit),
      },
      metrics,
    };
  }
}
