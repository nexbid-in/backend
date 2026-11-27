import { Stock } from "../../../domain/entities/Stock";
import {
  StockPerformanceReturns,
  StockRange52W,
  StockVitals,
} from "../../../domain/services/market/StockPerformanceCalculator";
import { StockOverviewResponseDTO } from "../../dto/market/StockOverviewDTO";

/**
 * Maps stock domain entities and calculated market analytics to StockOverviewResponseDTO.
 */
export class StockOverviewDTOMapper {
  static toDTO(params: {
    stock: Stock;
    vitals: StockVitals;
    range52W: StockRange52W;
    performance: StockPerformanceReturns;
    lastUpdated: number;
  }): StockOverviewResponseDTO {
    const { stock, vitals, range52W, performance, lastUpdated } = params;

    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      type: stock.type,
      isTradable: stock.isTradable,
      isActive: stock.isActive,
      vitals,
      range52W,
      performance,
      lastUpdated,
    };
  }
}
