import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";

export type TradebookSegment = "ALL" | "CNC" | "MIS";
export type TradebookSide = "ALL" | "BUY" | "SELL";

export interface TradebookQueryDTO {
  from?: Date;
  to?: Date;
  symbol?: string;
  segment?: TradebookSegment;
  side?: TradebookSide;
  page?: number;
  limit?: number;
}

export interface TradeChargesItemDTO {
  brokerage: number;
  stt: number;
  exchangeTurnoverCharges: number;
  sebiCharges: number;
  stampDuty: number;
  gst: number;
  total: number;
}

export interface TradebookItemDTO {
  id: string;
  orderId: string;
  symbol: string;
  exchange: string;
  productType: ProductType;
  side: OrderSide;
  quantity: number;
  price: number;
  tradeValue: number;
  charges: TradeChargesItemDTO;
  executedAt: string;
}

export interface TradebookSummaryDTO {
  totalTrades: number;
  totalBuyTurnover: number;
  totalSellTurnover: number;
  totalCharges: number;
}

export interface TradebookPaginationDTO {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface GetTradebookResponseDTO {
  trades: TradebookItemDTO[];
  summary: TradebookSummaryDTO;
  pagination: TradebookPaginationDTO;
}
