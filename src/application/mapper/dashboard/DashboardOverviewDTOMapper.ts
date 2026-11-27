import { User } from "../../../domain/entities/User";
import { Wallet } from "../../../domain/entities/Wallet";
import { HoldingsValuationSummary } from "../../../domain/services/trading/HoldingsValuationCalculator";
import { PositionsValuationSummary } from "../../../domain/services/trading/PositionsValuationCalculator";
import { DashboardOverviewResponseDTO } from "../../dto/dashboard/DashboardOverviewDTO";
import { MarketStatusInfo } from "../../services/trading/MarketHoursService";

/**
 * Maps user, wallet, market status, and portfolio summaries into DashboardOverviewResponseDTO.
 */
export class DashboardOverviewDTOMapper {
  static toDTO(params: {
    user: User;
    wallet: Wallet;
    marketStatus: MarketStatusInfo;
    holdingsSummary: HoldingsValuationSummary;
    positionsSummary: PositionsValuationSummary;
  }): DashboardOverviewResponseDTO {
    const {
      user,
      wallet,
      marketStatus,
      holdingsSummary,
      positionsSummary,
    } = params;

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const availableCash = wallet.balance.toNumber();
    const availableMargin = wallet.availableMargin.toNumber();
    const usedMargin = wallet.usedMargin.toNumber();

    return {
      user: {
        id: user.id,
        name: fullName || user.firstName,
        email: user.email.getValue(),
      },
      marketStatus: {
        isOpen: marketStatus.isOpen,
        session: marketStatus.session,
        currentIstTime: marketStatus.currentIstTime,
      },
      margins: {
        availableMargin,
        usedMargin,
        availableCash,
        openingBalance: +(availableCash + usedMargin).toFixed(2),
        tradingStatus: wallet.status,
      },
      holdings: {
        totalHoldingsCount: holdingsSummary.holdingsCount,
        totalInvestmentValue: holdingsSummary.totalInvested,
        totalCurrentValue: holdingsSummary.currentValue,
        totalPnl: holdingsSummary.totalPnL,
        totalPnlPercentage: holdingsSummary.totalPnLPercentage,
        dayPnl: holdingsSummary.todayPnL,
        dayPnlPercentage: holdingsSummary.todayPnLPercentage,
      },
      positions: {
        openPositionsCount: positionsSummary.openCount,
        dayRealizedPnL: positionsSummary.totalRealizedPnL,
        dayUnrealizedPnL: positionsSummary.totalUnrealizedPnL,
        dayNetPnL: positionsSummary.netPnL,
        sessionPositionsCount: positionsSummary.totalCount,
      },
    };
  }
}
