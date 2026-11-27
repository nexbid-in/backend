import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { HoldingsValuationCalculator } from "../../../domain/services/trading/HoldingsValuationCalculator";
import { PositionsValuationCalculator } from "../../../domain/services/trading/PositionsValuationCalculator";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { DashboardOverviewResponseDTO } from "../../dto/dashboard/DashboardOverviewDTO";
import { IGetDashboardOverviewUseCase } from "../../interface/use-cases/dashboard/IGetDashboardOverviewUseCase";
import { DashboardOverviewDTOMapper } from "../../mapper/dashboard/DashboardOverviewDTOMapper";
import { MarketQuoteBatchService } from "../../services/market/MarketQuoteBatchService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";

/**
 * Orchestrates user/wallet validation, concurrent portfolio data loading, single-batch
 * live quote retrieval, domain portfolio valuation, and dashboard DTO mapping.
 */
export class GetDashboardOverviewUseCase
  implements IGetDashboardOverviewUseCase
{
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly quoteBatchService: MarketQuoteBatchService,
    private readonly enforceMarketHours: boolean
  ) {}

  async execute(userId: string): Promise<DashboardOverviewResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();

    const [user, wallet, allPositions, todayTrades] = await Promise.all([
      this.userRepo.findById(userId),
      this.walletRepo.findOrCreateByUserId(userId),
      this.positionRepo.findAllPositionsByUserId(userId),
      this.tradeRepo.findByUserId(userId, { from: startOfTodayIst }),
    ]);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    const marketStatus = MarketHoursService.getMarketStatus(
      this.enforceMarketHours
    );

    const { active: activeHoldings } =
      HoldingsValuationCalculator.selectHoldings(allPositions, startOfTodayIst);
    const sessionMisPositions =
      PositionsValuationCalculator.selectSessionPositions(
        allPositions,
        startOfTodayIst
      );
    const openMisPositions = sessionMisPositions.filter((pos) => pos.isOpen());

    const quotesBySymbol = await this.quoteBatchService.fetchQuotes(
      [...activeHoldings, ...openMisPositions].map((pos) => pos.symbol)
    );

    const holdingsEvaluation = HoldingsValuationCalculator.evaluate({
      positions: allPositions,
      quotesBySymbol,
      startOfTodayIst,
      includeExited: false,
    });

    const positionsEvaluation = PositionsValuationCalculator.evaluate({
      sessionPositions: sessionMisPositions,
      todayTrades,
      quotesBySymbol,
    });

    return DashboardOverviewDTOMapper.toDTO({
      user,
      wallet,
      marketStatus,
      holdingsSummary: holdingsEvaluation.summary,
      positionsSummary: positionsEvaluation.summary,
    });
  }
}
