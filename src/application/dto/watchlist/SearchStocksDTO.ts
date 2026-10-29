import { InstrumentType } from "../../../domain/entities/Stock";

export type SearchStocksRequestDTO = {
  query: string;
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

export type SearchStocksResponseDTO = {
  stocks: StockItemDTO[];
};
