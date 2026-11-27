import {
  PnlCalculationReport,
  SymbolPnlSummary,
} from "../../../domain/services/trading/PnlReportAggregator";
import {
  GetPnlStatementResponseDTO,
  PnlHeatmapDayDTO,
  PnlSegment,
  PnlViewType,
} from "../../dto/trading/PnlDTOs";

/**
 * Projects pure domain P&L accounting data into the endpoint's read-model DTO,
 * including view filtering and heatmap day classification.
 */
export class PnlStatementDTOMapper {
  static toDTO(params: {
    report: PnlCalculationReport;
    pnlType: PnlViewType;
    fromDate?: Date;
    toDate?: Date;
    segment: PnlSegment;
  }): GetPnlStatementResponseDTO {
    const { report, pnlType, fromDate, toDate, segment } = params;

    let greenDays = 0;
    let redDays = 0;
    const days: PnlHeatmapDayDTO[] = report.dailyPnl.map((day) => {
      if (day.netPnL.isPositive()) greenDays++;
      else if (day.netPnL.isNegative()) redDays++;

      return {
        date: day.date,
        grossPnL: day.grossPnL.toNumber(),
        netPnL: day.netPnL.toNumber(),
        tradesCount: day.tradesCount,
      };
    });

    const filteredSymbols = report.symbols.filter((sym) =>
      this.matchesView(sym, pnlType)
    );

    return {
      summary: {
        realizedPnL: report.realizedPnL.toNumber(),
        charges: report.charges.toNumber(),
        netRealizedPnL: report.netRealizedPnL.toNumber(),
        unrealizedPnL: report.unrealizedPnL.toNumber(),
        chargesBreakdown: report.chargesBreakdown.toNumericValues(),
      },
      heatmap: {
        greenDays,
        redDays,
        days,
      },
      symbols: filteredSymbols.map((sym) => ({
        symbol: sym.symbol,
        exchange: sym.exchange,
        quantity: sym.closedQty,
        buyAvg: sym.buyAvg,
        buyValue: sym.buyValue.toNumber(),
        sellAvg: sym.sellAvg,
        sellValue: sym.sellValue.toNumber(),
        netRealizedPnL: sym.netRealizedPnL.toNumber(),
        unrealizedPnL: sym.unrealizedPnL.toNumber(),
        openQuantity: sym.openQty,
      })),
      fromDate,
      toDate,
      segment,
    };
  }

  private static matchesView(
    symbol: SymbolPnlSummary,
    pnlType: PnlViewType
  ): boolean {
    if (pnlType === "REALIZED") {
      return symbol.closedQty > 0;
    }
    if (pnlType === "UNREALIZED") {
      return symbol.openQty > 0;
    }
    return symbol.closedQty > 0 || symbol.openQty > 0;
  }
}
