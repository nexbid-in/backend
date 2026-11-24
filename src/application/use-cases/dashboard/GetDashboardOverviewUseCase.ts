import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IGetDashboardOverviewUseCase } from "../../interface/use-cases/dashboard/IGetDashboardOverviewUseCase";
import {
  DashboardOverviewResponseDTO,
  HoldingAllocationItemDTO,
  RecentPositionItemDTO,
  BenchmarkIndexDTO,
} from "../../dto/dashboard/DashboardOverviewDTO";
import { ProductType } from "../../../domain/entities/trading/Position";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { env } from "../../../infrastructure/config/env";
import { Money } from "../../../domain/value-objects/Money";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

const BENCHMARK_INDICES = [
  { symbol: "NIFTY 50", name: "Nifty 50", baseline: 24500 },
  { symbol: "SENSEX", name: "Sensex", baseline: 80000 },
  { symbol: "BANKNIFTY", name: "Nifty Bank", baseline: 52000 },
];

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

    // 2. Market Status
    const marketStatusInfo = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);
    const statusText = marketStatusInfo.isOpen
      ? "Market is open"
      : marketStatusInfo.session === "PRE_MARKET"
      ? "Pre-market session"
      : marketStatusInfo.session === "POST_MARKET"
      ? "Post-market session"
      : "Market is closed";

    // 3. Benchmark Indices
    const indices: BenchmarkIndexDTO[] = await Promise.all(
      BENCHMARK_INDICES.map(async (idx) => {
        try {
          const quote = await this.marketDataService.getQuote(idx.symbol);
          const ltp = quote?.ltp && quote.ltp > 0 ? quote.ltp : idx.baseline;
          const change = quote?.change ?? 0;
          const changePercent = quote?.changePercent ?? 0;
          return {
            symbol: idx.symbol,
            name: idx.name,
            ltp,
            change,
            changePercent,
          };
        } catch {
          return {
            symbol: idx.symbol,
            name: idx.name,
            ltp: idx.baseline,
            change: 0,
            changePercent: 0,
          };
        }
      })
    );

    // 4. Margins & Capital
    const availableCash = wallet.balance.toNumber();
    const availableMargin = wallet.availableMargin.toNumber();
    const usedMargin = wallet.usedMargin.toNumber();
    const openingBalance = +(availableCash + usedMargin).toFixed(2);

    // 5. Holdings Overview (CNC)
    const cncPositions = allPositions.filter(
      (pos) => pos.productType === ProductType.CNC && pos.quantity > 0
    );

    let totalInvestedMoney = Money.zero();
    let totalCurrentValueMoney = Money.zero();
    let totalDayPnlMoney = Money.zero();

    const rawHoldingsList: Array<{
      symbol: string;
      quantity: number;
      currentLtp: number;
      investedValue: number;
      currentValue: number;
      totalPnl: number;
      totalPnlPercentage: number;
    }> = [];

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

      const invNum = invMoney.toNumber();
      const pnlNum = pnlMoney.toNumber();
      const pnlPercentage = invNum > 0 ? +((pnlNum / invNum) * 100).toFixed(2) : 0;

      rawHoldingsList.push({
        symbol: pos.symbol,
        quantity: pos.quantity,
        currentLtp,
        investedValue: invNum,
        currentValue: curMoney.toNumber(),
        totalPnl: pnlNum,
        totalPnlPercentage: pnlPercentage,
      });
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

    // Build allocation sorted by current value descending
    rawHoldingsList.sort((a, b) => b.currentValue - a.currentValue);
    const allocation: HoldingAllocationItemDTO[] = rawHoldingsList.map((h) => ({
      symbol: h.symbol,
      quantity: h.quantity,
      currentLtp: h.currentLtp,
      investmentValue: h.investedValue,
      currentValue: h.currentValue,
      totalPnl: h.totalPnl,
      totalPnlPercentage: h.totalPnlPercentage,
      weightagePercentage:
        totalCurrentValNum > 0
          ? +((h.currentValue / totalCurrentValNum) * 100).toFixed(2)
          : 0,
    }));

    // 6. Positions Overview (MIS)
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
    const recentPositions: RecentPositionItemDTO[] = [];

    for (const pos of sessionMisPositions) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;
      const unrealized = pos.calculateUnrealizedPnL(currentLtp);

      if (pos.isOpen()) {
        openPositionsCount++;
        totalUnrealizedPnL = totalUnrealizedPnL.add(unrealized);
      }

      const costBasis = pos.averagePrice * pos.quantity;
      const pnlPercentage =
        costBasis > 0 ? +((unrealized / costBasis) * 100).toFixed(2) : 0;

      recentPositions.push({
        id: pos.id,
        symbol: pos.symbol,
        productType: pos.productType,
        side: pos.side,
        quantity: pos.quantity,
        averagePrice: pos.averagePrice,
        ltp: currentLtp,
        unrealizedPnL: unrealized,
        pnlPercentage,
      });
    }

    // Sort recent positions so open positions appear first, then by updatedAt descending
    recentPositions.sort((a, b) => {
      if (a.quantity > 0 && b.quantity === 0) return -1;
      if (a.quantity === 0 && b.quantity > 0) return 1;
      return 0;
    });

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
        statusText,
      },
      indices,
      margins: {
        availableMargin,
        usedMargin,
        availableCash,
        openingBalance,
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
        allocation,
      },
      positions: {
        openPositionsCount,
        dayRealizedPnL: dayRealizedNum,
        dayUnrealizedPnL: dayUnrealizedNum,
        dayNetPnL,
        recentPositions: recentPositions.slice(0, 5),
      },
    };
  }
}
