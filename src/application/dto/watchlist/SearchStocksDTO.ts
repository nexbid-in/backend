import { InstrumentType } from "../../../domain/entities/Stock";

export type SearchStocksRequestDTO = {
  query?: string;
  type?: "ALL" | "EQUITY" | "INDEX";
  page?: number;
  limit?: number;
};

export type StockItemDTO = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  type: InstrumentType;
  isActive: boolean;
  isTradable: boolean;
};

export type PaginationDTO = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type CountsDTO = {
  all: number;
  equities: number;
  indices: number;
};

export type SearchStocksResponseDTO = {
  stocks: StockItemDTO[];
  pagination: PaginationDTO;
  counts: CountsDTO;
};
