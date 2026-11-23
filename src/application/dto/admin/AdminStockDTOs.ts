import { InstrumentType } from "../../../domain/entities/Stock";

export type AdminStocksQueryDTO = {
  page: number;
  limit: number;
  query?: string;
  type?: "ALL" | InstrumentType;
  isActive?: boolean;
  isTradable?: boolean;
  sector?: string;
};

export type AdminStockItemDTO = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  type: InstrumentType;
  feedSymbol: string | null;
  isActive: boolean;
  isTradable: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderCount: number;
};

export type AdminStockMetricsDTO = {
  totalStocks: number;
  activeStocks: number;
  tradableStocks: number;
  totalSectors: number;
};

export type PaginatedAdminStocksResponseDTO = {
  stocks: AdminStockItemDTO[];
  pagination: {
    page: number;
    limit: number;
    totalStocks: number;
    totalPages: number;
  };
  metrics: AdminStockMetricsDTO;
};

export type CreateStockDTO = {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string | null;
  type: InstrumentType;
  feedSymbol?: string | null;
  isActive?: boolean;
  isTradable?: boolean;
};

export type UpdateStockStatusDTO = {
  stockId: string;
  isActive?: boolean;
  isTradable?: boolean;
};

export type UpdateStockDTO = {
  stockId: string;
  name?: string;
  exchange?: string;
  sector?: string | null;
  type?: InstrumentType;
  feedSymbol?: string | null;
};

export type DeleteStockDTO = {
  stockId: string;
};

export type VerifyStockSymbolDTO = {
  symbol: string;
  feedSymbol?: string | null;
  type?: InstrumentType;
};

export type VerifyStockSymbolResponseDTO = {
  valid: boolean;
  symbol: string;
  resolvedFeedSymbol: string;
  ltp?: number;
  description?: string;
  exchange?: string;
  message: string;
};
