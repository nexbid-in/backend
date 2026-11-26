import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IGetDashboardOverviewUseCase } from "../../interface/use-cases/dashboard/IGetDashboardOverviewUseCase";
import { DashboardOverviewResponseDTO } from "../../dto/dashboard/DashboardOverviewDTO";
import { ProductType } from "../../../domain/entities/trading/Position";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { env } from "../../../infrastructure/config/env";
import { Money } from "../../../domain/value-objects/Money";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GetDashboardOverviewUseCase implements IGetDashboardOverviewUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(userId: string): Promise<DashboardOverviewResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();

    // 1. Fetch user, wallet, positions, and today's trades concurrently
    const [user, wallet, allPositions, todayTrades] = await Promise.all([
      this.userRepo.findById(userId),
      this.walletRepo.findOrCreateByUserId(userId),
      this.positionRepo.findAllPositionsByUserId(userId),
      this.tradeRepo.findByUserId(userId, { from: startOfTodayIst }),
    ]);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, "User not found");
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED, "Account is blocked");
    }

    // 2. Market Status (only currentIstTime & session needed by frontend clock header)
    const marketStatusInfo = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);

    // 3. Margins & Capital
    const availableCash = wallet.balance.toNumber();
    const availableMargin = wallet.availableMargin.toNumber();
    const usedMargin = wallet.usedMargin.toNumber();

    // 4. Holdings Overview (CNC)
    const cncPositions = allPositions.filter(
      (pos) => pos.productType === ProductType.CNC && pos.quantity > 0
    );

    let totalInvestedMoney = Money.zero();
    let totalCurrentValueMoney = Money.zero();
    let totalDayPnlMoney = Money.zero();

    for (const pos of cncPositions) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

      const avgMoney = Money.of(pos.averagePrice);
      const ltpMoney = Money.of(currentLtp);

      const invMoney = avgMoney.multiply(pos.quantity);
      const curMoney = ltpMoney.multiply(pos.quantity);
      const pnlMoney = curMoney.subtract(invMoney);

      totalInvestedMoney = totalInvestedMoney.add(invMoney);
      totalCurrentValueMoney = totalCurrentValueMoney.add(curMoney);

      const isBoughtToday = pos.createdAt >= startOfTodayIst;
      if (isBoughtToday) {
        totalDayPnlMoney = totalDayPnlMoney.add(pnlMoney);
      } else {
        const prevClose = quote?.close && quote.close > 0 ? quote.close : pos.averagePrice;
        const dayChange = currentLtp - prevClose;
        const dayPnl = Money.of(dayChange).multiply(pos.quantity);
        totalDayPnlMoney = totalDayPnlMoney.add(dayPnl);
      }
    }

    const totalInvestedNum = totalInvestedMoney.toNumber();
    const totalCurrentValNum = totalCurrentValueMoney.toNumber();
    const totalPnlMoney = totalCurrentValueMoney.subtract(totalInvestedMoney);
    const totalPnlNum = totalPnlMoney.toNumber();
    const totalPnlPercentage =
      totalInvestedNum > 0 ? +((totalPnlNum / totalInvestedNum) * 100).toFixed(2) : 0;

    const totalDayPnlNum = totalDayPnlMoney.toNumber();
    const totalDayPnlPercentage =
      totalInvestedNum > 0 ? +((totalDayPnlNum / totalInvestedNum) * 100).toFixed(2) : 0;

    // 5. Positions Overview (MIS)
    let totalRealizedPnL = Money.zero();
    for (const trade of todayTrades) {
      if (trade.productType === ProductType.MIS) {
        totalRealizedPnL = totalRealizedPnL.add(trade.realizedPnL);
      }
    }

    const sessionMisPositions = allPositions.filter(
      (pos) =>
        pos.productType === ProductType.MIS &&
        (pos.isOpen() || pos.updatedAt >= startOfTodayIst)
    );

    let totalUnrealizedPnL = Money.zero();
    let openPositionsCount = 0;

    for (const pos of sessionMisPositions) {
      // Only fetch live quote for positions that are currently OPEN
      if (pos.isOpen()) {
        openPositionsCount++;
        const quote = await this.marketDataService.getQuote(pos.symbol);
        const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;
        const unrealized = pos.calculateUnrealizedPnL(currentLtp);
        totalUnrealizedPnL = totalUnrealizedPnL.add(unrealized);
      }
    }

    const dayRealizedNum = totalRealizedPnL.toNumber();
    const dayUnrealizedNum = totalUnrealizedPnL.toNumber();
    const dayNetPnL = +(dayRealizedNum + dayUnrealizedNum).toFixed(2);

    const userName = `${user.firstName} ${user.lastName}`.trim();

    return {
      user: {
        id: user.id,
        name: userName || user.firstName,
        email: user.email.getValue(),
      },
      marketStatus: {
        isOpen: marketStatusInfo.isOpen,
        session: marketStatusInfo.session,
        currentIstTime: marketStatusInfo.currentIstTime,
        statusText: "",
      },
      indices: [],
      margins: {
        availableMargin,
        usedMargin,
        availableCash,
        openingBalance: +(availableCash + usedMargin).toFixed(2),
        tradingStatus: wallet.status,
      },
      holdings: {
        totalHoldingsCount: cncPositions.length,
        totalInvestmentValue: totalInvestedNum,
        totalCurrentValue: totalCurrentValNum,
        totalPnl: totalPnlNum,
        totalPnlPercentage,
        dayPnl: totalDayPnlNum,
        dayPnlPercentage: totalDayPnlPercentage,
        allocation: [],
      },
      positions: {
        openPositionsCount,
        dayRealizedPnL: dayRealizedNum,
        dayUnrealizedPnL: dayUnrealizedNum,
        dayNetPnL,
        recentPositions: sessionMisPositions.map((pos) => ({
          id: pos.id,
          symbol: pos.symbol,
          productType: pos.productType,
          side: pos.side,
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          ltp: pos.averagePrice,
          unrealizedPnL: 0,
          pnlPercentage: 0,
        })),
      },
    };
  }
}
