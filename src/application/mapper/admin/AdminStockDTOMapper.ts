import { Stock } from "../../../domain/entities/Stock";
import {
  AdminStockItemDTO,
  AdminStockMetricsDTO,
  PaginatedAdminStocksResponseDTO,
} from "../../dto/admin/AdminStockDTOs";

/**
 * Maps Stock domain entities and query metadata into admin stock response DTOs.
 */
export class AdminStockDTOMapper {
  static toItemDTO(stock: Stock, canDelete: boolean): AdminStockItemDTO {
    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      type: stock.type,
      feedSymbol: stock.feedSymbol,
      isActive: stock.isActive,
      isTradable: stock.isTradable,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
      canDelete,
    };
  }

  static toPaginatedDTO(params: {
    stocks: Stock[];
    orderCounts: Record<string, number>;
    total: number;
    page: number;
    limit: number;
    metrics: AdminStockMetricsDTO;
  }): PaginatedAdminStocksResponseDTO {
    const { stocks, orderCounts, total, page, limit, metrics } = params;

    return {
      stocks: stocks.map((stock) =>
        this.toItemDTO(stock, (orderCounts[stock.id] || 0) === 0)
      ),
      pagination: {
        page,
        limit,
        totalStocks: total,
        totalPages: Math.ceil(total / limit),
      },
      metrics,
    };
  }
}
