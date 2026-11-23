import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";

export interface PnlStatementQueryDTO {
  from?: Date;
  to?: Date;
  symbol?: string;
  productType?: ProductType;
}

export interface PnlChargesBreakdownDTO {
  brokerage: number;
  stt: number;
  exchangeTurnoverCharges: number;
  sebiCharges: number;
  stampDuty: number;
  gst: number;
  totalCharges: number;
}

export interface PnlSummaryDTO {
  grossRealizedPnL: number;
  totalCharges: number;
  netRealizedPnL: number;
  unrealizedPnL: number;
  totalTrades: number;
  profitableTrades: number;
  lossTrades: number;
  winRate: number;
  chargesBreakdown: PnlChargesBreakdownDTO;
}

export interface PnlTradeLotDTO {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: number;
  tradeValue: number;
  realizedPnL: number;
  charges: PnlChargesBreakdownDTO;
  netPnL: number;
  executedAt: Date;
}

export interface PnlSymbolSummaryDTO {
  symbol: string;
  productType: ProductType;
  buyQty: number;
  buyAmount: number;
  avgBuyPrice: number;
  sellQty: number;
  sellAmount: number;
  avgSellPrice: number;
  grossRealizedPnL: number;
  totalCharges: number;
  netRealizedPnL: number;
  chargesBreakdown: PnlChargesBreakdownDTO;
  openQty: number;
  currentLtp: number;
  unrealizedPnL: number;
  trades: PnlTradeLotDTO[];
}

export interface GetPnlStatementResponseDTO {
  summary: PnlSummaryDTO;
  symbols: PnlSymbolSummaryDTO[];
  fromDate?: Date;
  toDate?: Date;
}
