import { StockItemDTO } from "./SearchStocksDTO";

export type GetWatchlistRequestDTO = {
  userId: string;
};

export type WatchlistItemDTO = {
  id: string;
  stockId: string;
  order: number;
  addedAt: Date;
  stock: StockItemDTO;
};

export type GetWatchlistResponseDTO = {
  items: WatchlistItemDTO[];
};

export type AddToWatchlistRequestDTO = {
  userId: string;
  stockId: string;
};

export type AddToWatchlistResponseDTO = {
  success: boolean;
  item: WatchlistItemDTO;
};

export type RemoveFromWatchlistRequestDTO = {
  userId: string;
  stockId: string;
};

export type RemoveFromWatchlistResponseDTO = {
  success: boolean;
  message: string;
};
