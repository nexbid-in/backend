import { StockPersistenceDTO } from "./StockPersistenceDTO";

export type WatchlistPersistenceDTO = {
  id: string;
  userId: string;
  stockId: string;
  order: number;
  createdAt: Date;
  stock?: StockPersistenceDTO | null;
};
