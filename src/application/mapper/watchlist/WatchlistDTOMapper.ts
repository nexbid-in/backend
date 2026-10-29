import { Stock } from "../../../domain/entities/Stock";
import { WatchlistItem } from "../../../domain/entities/WatchlistItem";
import { StockItemDTO } from "../../dto/watchlist/SearchStocksDTO";
import { WatchlistItemDTO } from "../../dto/watchlist/WatchlistDTO";

export class WatchlistDTOMapper {
  static toStockDTO(stock: Stock): StockItemDTO {
    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      type: stock.type,
      isActive: stock.isActive,
      isTradable: stock.isTradable,
    };
  }

  static toItemDTO(item: WatchlistItem): WatchlistItemDTO {
    return {
      id: item.id,
      stockId: item.stockId,
      order: item.order,
      addedAt: item.createdAt,
      stock: item.stock ? this.toStockDTO(item.stock) : ({} as StockItemDTO),
    };
  }
}
