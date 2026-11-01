import { Stock } from "../../entities/Stock";

export interface IStockRepository {
  findById(id: string): Promise<Stock | null>;
  findBySymbol(symbol: string): Promise<Stock | null>;
  search(query: string, limit?: number): Promise<Stock[]>;
}
