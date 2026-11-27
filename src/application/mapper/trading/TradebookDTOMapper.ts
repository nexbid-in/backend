import { Trade } from "../../../domain/entities/trading/Trade";
import { TradebookSummary } from "../../../domain/services/trading/TradebookCalculator";
import {
  GetTradebookResponseDTO,
  TradebookItemDTO,
} from "../../dto/trading/TradebookDTOs";

/**
 * Maps paginated trades and macro summary totals into GetTradebookResponseDTO.
 */
export class TradebookDTOMapper {
  static toDTO(params: {
    paginatedTrades: Trade[];
    stockExchangeMap: ReadonlyMap<string, string>;
    summary: TradebookSummary;
    page: number;
    limit: number;
    totalPages: number;
  }): GetTradebookResponseDTO {
    const {
      paginatedTrades,
      stockExchangeMap,
      summary,
      page,
      limit,
      totalPages,
    } = params;

    const trades: TradebookItemDTO[] = paginatedTrades.map((trade) => ({
      id: trade.id,
      orderId: trade.orderId,
      symbol: trade.symbol,
      exchange: stockExchangeMap.get(trade.symbol) ?? "NSE",
      productType: trade.productType,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price.toNumber(),
      tradeValue: trade.tradeValue.toNumber(),
      charges: {
        brokerage: trade.brokerage.toNumber(),
        stt: trade.stt.toNumber(),
        exchangeTurnoverCharges: trade.exchangeTurnoverCharges.toNumber(),
        sebiCharges: trade.sebiCharges.toNumber(),
        stampDuty: trade.stampDuty.toNumber(),
        gst: trade.gst.toNumber(),
        total: trade.totalCharges.toNumber(),
      },
      executedAt: trade.executedAt.toISOString(),
    }));

    return {
      trades,
      summary: {
        totalTrades: summary.totalTrades,
        totalBuyTurnover: summary.totalBuyTurnover.toNumber(),
        totalSellTurnover: summary.totalSellTurnover.toNumber(),
        totalCharges: summary.charges.totalCharges.toNumber(),
        chargesBreakdown: summary.charges.toNumericValues(),
      },
      pagination: {
        page,
        limit,
        totalCount: summary.totalTrades,
        totalPages,
      },
    };
  }
}
