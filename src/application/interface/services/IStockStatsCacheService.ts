import { StockOverviewStats } from "../../../domain/services/market/StockPerformanceCalculator";

/**
 * Cache port for storing and retrieving precomputed daily stock overview statistics.
 */
export interface IStockStatsCacheService {
  getOverviewStats(symbol: string, dateKey: string): Promise<StockOverviewStats | null>;
  setOverviewStats(
    symbol: string,
    dateKey: string,
    stats: StockOverviewStats
  ): Promise<void>;
}
