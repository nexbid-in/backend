import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IGetHoldingsUseCase } from "../../interface/use-cases/trading/IGetHoldingsUseCase";
import {
  GetHoldingsResponseDTO,
  HoldingItemDTO,
  HoldingsSummaryDTO,
} from "../../dto/trading/HoldingDTOs";
import { ProductType } from "../../../domain/entities/trading/Position";
import { MarketHoursService } from "../../services/trading/MarketHoursService";

export class GetHoldingsUseCase implements IGetHoldingsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(userId: string): Promise<GetHoldingsResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();
    const allPositions = await this.positionRepo.findAllPositionsByUserId(userId);

    const cncHoldings = allPositions.filter(
      (pos) => pos.productType === ProductType.CNC && pos.quantity > 0
    );

    const exitedCncPositions = allPositions.filter(
      (pos) =>
        pos.productType === ProductType.CNC &&
        pos.quantity === 0 &&
        pos.sellQty > 0 &&
        pos.updatedAt >= startOfTodayIst
    );

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalTodayPnL = 0;

    const mappedHoldings: HoldingItemDTO[] = [];

    for (const pos of cncHoldings) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

      const investedAmount = +(pos.averagePrice * pos.quantity).toFixed(2);
      const currentValue = +(currentLtp * pos.quantity).toFixed(2);
      const totalPnL = +(currentValue - investedAmount).toFixed(2);
      const totalPnLPercentage =
        investedAmount > 0 ? +((totalPnL / investedAmount) * 100).toFixed(2) : 0;

      const isBoughtToday = pos.createdAt >= startOfTodayIst;

      let dayChange: number;
      let dayChangePercentage: number;
      let dayPnL: number;

      if (isBoughtToday) {
        dayChange = +(currentLtp - pos.averagePrice).toFixed(2);
        dayChangePercentage =
          pos.averagePrice > 0 ? +((dayChange / pos.averagePrice) * 100).toFixed(2) : 0;
        dayPnL = totalPnL;
      } else {
        dayChange = quote?.change ?? 0;
        dayChangePercentage = quote?.changePercent ?? 0;
        dayPnL = +(dayChange * pos.quantity).toFixed(2);
      }

      totalInvested += investedAmount;
      totalCurrentValue += currentValue;
      totalTodayPnL += dayPnL;

      mappedHoldings.push({
        id: pos.id,
        stockId: pos.stockId,
        symbol: pos.symbol,
        quantity: pos.quantity,
        buyAvgPrice: pos.averagePrice,
        currentLtp,
        investedAmount,
        currentValue,
        totalPnL,
        totalPnLPercentage,
        dayChange,
        dayChangePercentage,
        dayPnL,
        isBoughtToday,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
      });
    }

    const mappedExitedHoldings: HoldingItemDTO[] = [];

    for (const pos of exitedCncPositions) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp =
        quote?.ltp && quote.ltp > 0
          ? quote.ltp
          : pos.sellQty > 0
          ? +(pos.sellAmount / pos.sellQty).toFixed(2)
          : pos.averagePrice;
      const buyAvgPrice =
        pos.buyQty > 0 ? +(pos.buyAmount / pos.buyQty).toFixed(2) : pos.averagePrice;
      const investedAmount = pos.buyAmount;
      const currentValue = pos.sellAmount;
      const totalPnL = pos.realizedPnL;
      const totalPnLPercentage =
        investedAmount > 0 ? +((totalPnL / investedAmount) * 100).toFixed(2) : 0;
      const dayChange = quote?.change ?? 0;
      const dayChangePercentage = quote?.changePercent ?? 0;
      const dayPnL = totalPnL;
      const isBoughtToday = pos.createdAt >= startOfTodayIst;

      mappedExitedHoldings.push({
        id: pos.id,
        stockId: pos.stockId,
        symbol: pos.symbol,
        quantity: pos.sellQty,
        buyAvgPrice,
        currentLtp,
        investedAmount,
        currentValue,
        totalPnL,
        totalPnLPercentage,
        dayChange,
        dayChangePercentage,
        dayPnL,
        isBoughtToday,
        isExited: true,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
      });
    }

    totalInvested = +totalInvested.toFixed(2);
    totalCurrentValue = +totalCurrentValue.toFixed(2);
    totalTodayPnL = +totalTodayPnL.toFixed(2);

    const totalPnL = +(totalCurrentValue - totalInvested).toFixed(2);
    const totalPnLPercentage =
      totalInvested > 0 ? +((totalPnL / totalInvested) * 100).toFixed(2) : 0;
    const todayPnLPercentage =
      totalInvested > 0 ? +((totalTodayPnL / totalInvested) * 100).toFixed(2) : 0;

    const summary: HoldingsSummaryDTO = {
      totalInvested,
      currentValue: totalCurrentValue,
      totalPnL,
      totalPnLPercentage,
      todayPnL: totalTodayPnL,
      todayPnLPercentage,
      holdingsCount: cncHoldings.length,
      exitedCount: exitedCncPositions.length,
    };

    return {
      holdings: mappedHoldings,
      exitedHoldings: mappedExitedHoldings,
      summary,
    };
  }
}
