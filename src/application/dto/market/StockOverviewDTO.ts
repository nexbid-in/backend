export interface GetStockOverviewRequestDTO {
  symbol: string;
}

export interface StockOverviewVitalsDTO {
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  atp: number;
  lowerCircuit: number | null;
  upperCircuit: number | null;
  totalBuyQty: number | null;
  totalSellQty: number | null;
  bidPrice: number | null;
  askPrice: number | null;
}

export interface StockRange52WDTO {
  high: number;
  low: number;
}

export interface StockPerformanceReturnsDTO {
  oneWeek: number | null;
  oneMonth: number | null;
  oneYear: number | null;
}

export interface StockOverviewResponseDTO {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  type: string;
  isTradable: boolean;
  isActive: boolean;
  vitals: StockOverviewVitalsDTO;
  range52W: StockRange52WDTO;
  performance: StockPerformanceReturnsDTO;
  lastUpdated: number;
}

