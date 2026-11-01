import { Stock } from "../../../domain/entities/Stock";
import { StockPersistenceDTO } from "../../dto/internal/StockPersistenceDTO";

export class StockPersistenceMapper {
  static toPrisma(stock: Stock): StockPersistenceDTO {
    return {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      type: stock.type,
      isActive: stock.isActive,
      isTradable: stock.isTradable,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };
  }

  static toDomain(raw: StockPersistenceDTO): Stock {
    return Stock.create({
      id: raw.id,
      symbol: raw.symbol,
      name: raw.name,
      exchange: raw.exchange,
      sector: raw.sector,
      type: raw.type,
      isActive: raw.isActive,
      isTradable: raw.isTradable,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
