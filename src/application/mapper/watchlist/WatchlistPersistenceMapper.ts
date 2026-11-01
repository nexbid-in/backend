import { WatchlistItem } from "../../../domain/entities/WatchlistItem";
import { WatchlistPersistenceDTO } from "../../dto/internal/WatchlistPersistenceDTO";
import { StockPersistenceMapper } from "../stock/StockPersistenceMapper";

export class WatchlistPersistenceMapper {
  static toPrisma(item: WatchlistItem): Omit<WatchlistPersistenceDTO, "stock"> {
    return {
      id: item.id,
      userId: item.userId,
      stockId: item.stockId,
      order: item.order,
      createdAt: item.createdAt,
    };
  }

  static toDomain(raw: WatchlistPersistenceDTO): WatchlistItem {
    return WatchlistItem.create({
      id: raw.id,
      userId: raw.userId,
      stockId: raw.stockId,
      order: raw.order,
      createdAt: raw.createdAt,
      stock: raw.stock ? StockPersistenceMapper.toDomain(raw.stock) : null,
    });
  }
}
