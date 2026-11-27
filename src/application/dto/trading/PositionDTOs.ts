import { ProductType, PositionSide } from "../../../domain/entities/trading/Position";

export interface PositionResponseDTO {
  id: string;
  symbol: string;
  productType: ProductType;
  side: PositionSide;
  quantity: number;
  averagePrice: number;
  currentLtp: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  updatedAt: Date;
}

export interface PortfolioSummaryDTO {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  netPnL: number;
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

