export interface HoldingItemDTO {
  id: string;
  stockId: string;
  symbol: string;
  quantity: number;
  buyAvgPrice: number;
  currentLtp: number;
  investedAmount: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  dayPnL: number;
  isBoughtToday: boolean;
  isExited?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HoldingsSummaryDTO {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  todayPnL: number;
  todayPnLPercentage: number;
  holdingsCount: number;
  exitedCount?: number;
}

export interface GetHoldingsResponseDTO {
  holdings: HoldingItemDTO[];
  exitedHoldings: HoldingItemDTO[];
  summary: HoldingsSummaryDTO;
}
