import { Stock } from "../../entities/Stock";

export interface StockSearchOptions {
  query?: string;
  type?: "ALL" | "EQUITY" | "INDEX";
  page?: number;
  limit?: number;
}

export interface StockSearchResult {
  stocks: Stock[];
  total: number;
  counts: {
    all: number;
    equities: number;
    indices: number;
  };
}

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

export interface IStockRepository {
  findById(id: string): Promise<Stock | null>;
  findBySymbol(symbol: string): Promise<Stock | null>;
  findByFeedSymbol(feedSymbol: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  search(options: StockSearchOptions): Promise<StockSearchResult>;
  findAdminStocks(filters: AdminStockFilters): Promise<{
    stocks: Stock[];
    total: number;
    metrics: AdminStockMetrics;
    orderCounts: Record<string, number>;
  }>;
  save(stock: Stock): Promise<Stock>;
  update(stock: Stock): Promise<Stock>;
  delete(id: string): Promise<boolean>;
  countOrdersByStockId(stockId: string): Promise<number>;
}
