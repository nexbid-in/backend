import {
  EvaluatedPositionItem,
  PositionsValuationResult,
} from "../../../domain/services/trading/PositionsValuationCalculator";
import {
  GetPositionsResponseDTO,
  PositionResponseDTO,
} from "../../dto/trading/PositionDTOs";

/**
 * Projects evaluated MIS positions and summary metrics into GetPositionsResponseDTO.
 */
export class PositionDTOMapper {
  static toDTO(
    result: PositionsValuationResult,
    filter: "OPEN" | "ALL" | "CLOSED" = "ALL"
  ): GetPositionsResponseDTO {
    const filteredItems =
      filter === "OPEN"
        ? result.items.filter((item) => item.isOpen)
        : filter === "CLOSED"
        ? result.items.filter((item) => !item.isOpen)
        : result.items;

    return {
      positions: filteredItems.map((item) => this.toItemDTO(item)),
      summary: {
        totalRealizedPnL: result.summary.totalRealizedPnL,
        totalUnrealizedPnL: result.summary.totalUnrealizedPnL,
        netPnL: result.summary.netPnL,
        positionsCount: {
          total: result.summary.totalCount,
          open: result.summary.openCount,
          closed: result.summary.closedCount,
        },
      },
    };
  }

  static toItemDTO(item: EvaluatedPositionItem): PositionResponseDTO {
    return {
      id: item.id,
      symbol: item.symbol,
      productType: item.productType,
      side: item.side,
      quantity: item.quantity,
      averagePrice: item.averagePrice,
      currentLtp: item.currentLtp,
      unrealizedPnL: item.unrealizedPnL,
      realizedPnL: item.realizedPnL,
      totalPnL: item.totalPnL,
      pnlPercentage: item.pnlPercentage,
      updatedAt: item.updatedAt,
    };
  }
}
