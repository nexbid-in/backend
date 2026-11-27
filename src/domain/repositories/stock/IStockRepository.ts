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
}

export interface IStockRepository {
  findById(id: string): Promise<Stock | null>;
  findBySymbol(symbol: string): Promise<Stock | null>;
  findByFeedSymbol(feedSymbol: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  search(options: StockSearchOptions): Promise<StockSearchResult>;
  save(stock: Stock): Promise<Stock>;
  update(stock: Stock): Promise<Stock>;
  delete(id: string): Promise<boolean>;
  countOrdersByStockId(stockId: string): Promise<number>;
}
