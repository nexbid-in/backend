export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
}

export interface MarketStatusDTO {
  isOpen: boolean;
  session: "REGULAR" | "PRE_MARKET" | "POST_MARKET" | "CLOSED";
  currentIstTime: string;
  statusText: string;
}

export interface BenchmarkIndexDTO {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
}

export interface MarginsDTO {
  availableMargin: number;
  usedMargin: number;
  availableCash: number;
  openingBalance: number;
  tradingStatus: string;
}

export interface HoldingAllocationItemDTO {
  symbol: string;
  quantity: number;
  currentLtp: number;
  investmentValue: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  weightagePercentage: number;
}

export interface HoldingsOverviewDTO {
  totalHoldingsCount: number;
  totalInvestmentValue: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  dayPnl: number;
  dayPnlPercentage: number;
  allocation: HoldingAllocationItemDTO[];
}

export interface RecentPositionItemDTO {
  id: string;
  symbol: string;
  productType: string;
  side: string;
  quantity: number;
  averagePrice: number;
  ltp: number;
  unrealizedPnL: number;
  pnlPercentage: number;
}

export interface PositionsOverviewDTO {
  openPositionsCount: number;
  dayRealizedPnL: number;
  dayUnrealizedPnL: number;
  dayNetPnL: number;
  recentPositions: RecentPositionItemDTO[];
}

export interface DashboardOverviewResponseDTO {
  user: UserProfileDTO;
  marketStatus: MarketStatusDTO;
  indices: BenchmarkIndexDTO[];
  margins: MarginsDTO;
  holdings: HoldingsOverviewDTO;
  positions: PositionsOverviewDTO;
}
