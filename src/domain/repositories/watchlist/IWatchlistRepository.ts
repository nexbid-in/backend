import { WatchlistItem } from "../../entities/WatchlistItem";

export interface IWatchlistRepository {
  findByUserId(userId: string): Promise<WatchlistItem[]>;
  findByUserAndStockId(userId: string, stockId: string): Promise<WatchlistItem | null>;
  save(item: WatchlistItem): Promise<void>;
  delete(userId: string, stockId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
