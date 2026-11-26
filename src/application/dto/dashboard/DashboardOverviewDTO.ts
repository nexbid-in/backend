export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
}

export interface MarketStatusDTO {
  isOpen: boolean;
  session: "REGULAR" | "PRE_MARKET" | "POST_MARKET" | "CLOSED";
  currentIstTime: string;
}

export interface MarginsDTO {
  availableMargin: number;
  usedMargin: number;
  availableCash: number;
  openingBalance: number;
  tradingStatus: string;
}

export interface HoldingsOverviewDTO {
  totalHoldingsCount: number;
  totalInvestmentValue: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  dayPnl: number;
  dayPnlPercentage: number;
}

export interface PositionsOverviewDTO {
  openPositionsCount: number;
  dayRealizedPnL: number;
  dayUnrealizedPnL: number;
  dayNetPnL: number;
  sessionPositionsCount: number;
}

export interface DashboardOverviewResponseDTO {
  user: UserProfileDTO;
  marketStatus: MarketStatusDTO;
  margins: MarginsDTO;
  holdings: HoldingsOverviewDTO;
  positions: PositionsOverviewDTO;
}
