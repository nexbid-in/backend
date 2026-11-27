export type PnlViewType = "COMBINED" | "REALIZED" | "UNREALIZED";
export type PnlSegment = "ALL" | "CNC" | "MIS" | "COMBINED" | "DELIVERY" | "INTRADAY";

export interface PnlStatementQueryDTO {
  from?: Date;
  to?: Date;
  symbol?: string;
  pnlType?: PnlViewType;
  segment?: PnlSegment;
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

export interface PnlHeatmapDayDTO {
  date: string; // 'YYYY-MM-DD'
  grossPnL: number;
  netPnL: number;
  tradesCount: number;
}

export interface PnlHeatmapSummaryDTO {
  greenDays: number;
  redDays: number;
  days: PnlHeatmapDayDTO[];
}

export interface PnlSummaryDTO {
  realizedPnL: number;      // Gross Realized P&L
  charges: number;          // Total charges & taxes
  netRealizedPnL: number;   // Net Realized P&L (realizedPnL - charges)
  unrealizedPnL: number;    // Open positions MTM P&L
  chargesBreakdown: PnlChargesBreakdownDTO;
}

export interface PnlSymbolSummaryDTO {
  symbol: string;
  exchange: string;         // e.g. "NSE"
  quantity: number;         // Matched closed quantity
  buyAvg: number;
  buyValue: number;
  sellAvg: number;
  sellValue: number;
  netRealizedPnL: number;   // Net Realized P&L (Zerodha primary column)
  unrealizedPnL: number;    // MTM on open quantity
  openQuantity: number;     // Open inventory still holding
}

export interface GetPnlStatementResponseDTO {
  summary: PnlSummaryDTO;
  heatmap: PnlHeatmapSummaryDTO;
  symbols: PnlSymbolSummaryDTO[];
  fromDate?: Date;
  toDate?: Date;
  segment: PnlSegment;
}
