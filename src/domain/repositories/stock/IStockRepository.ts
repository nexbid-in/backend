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

export interface IStockRepository {
  findById(id: string): Promise<Stock | null>;
  findBySymbol(symbol: string): Promise<Stock | null>;
  search(options: StockSearchOptions): Promise<StockSearchResult>;
}
