import { HoldingsValuationResult } from "../../../domain/services/trading/HoldingsValuationCalculator";
import { GetHoldingsResponseDTO } from "../../dto/trading/HoldingDTOs";

/**
 * Maps domain CNC holdings valuation results into GetHoldingsResponseDTO.
 */
export class HoldingDTOMapper {
  static toDTO(result: HoldingsValuationResult): GetHoldingsResponseDTO {
    return {
      holdings: result.holdings,
      exitedHoldings: result.exitedHoldings,
      summary: {
        totalInvested: result.summary.totalInvested,
        currentValue: result.summary.currentValue,
        totalPnL: result.summary.totalPnL,
        totalPnLPercentage: result.summary.totalPnLPercentage,
        todayPnL: result.summary.todayPnL,
        todayPnLPercentage: result.summary.todayPnLPercentage,
        holdingsCount: result.summary.holdingsCount,
        exitedCount: result.summary.exitedCount,
      },
    };
  }
}
