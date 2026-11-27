import { Stock } from "../../../../domain/entities/Stock";

export interface AdminStockFilters {
  query?: string;
  type?: "ALL" | "EQUITY" | "INDEX";
  isActive?: boolean;
  isTradable?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminStockMetrics {
  totalStocks: number;
  activeStocks: number;
  tradableStocks: number;
}

export interface AdminStockQueryResult {
  stocks: Stock[];
  total: number;
  metrics: AdminStockMetrics;
  orderCounts: Record<string, number>;
}

/**
 * Dedicated admin read-model query repository for filtered stock listings, metrics, and order counts.
 */
export interface IAdminStockQueryRepository {
  findAdminStocks(filters: AdminStockFilters): Promise<AdminStockQueryResult>;
}
