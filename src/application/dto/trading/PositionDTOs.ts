import { ProductType, PositionSide } from "../../../domain/entities/trading/Position";

export interface PositionResponseDTO {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  productType: ProductType;
  side: PositionSide;
  quantity: number;
  buyQty: number;
  buyAmount: number;
  sellQty: number;
  sellAmount: number;
  averagePrice: number;
  currentLtp: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  blockedMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummaryDTO {
  totalInvestment: number;
  currentPortfolioValue: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  netPnL: number;
  overallReturnPercentage: number;
  positionsCount: {
    total: number;
    open: number;
    closed: number;
  };
}

export interface GetPositionsResponseDTO {
  positions: PositionResponseDTO[];
  summary: PortfolioSummaryDTO;
}

export interface SquareOffPositionRequestDTO {
  userId: string;
  positionId: string;
}

