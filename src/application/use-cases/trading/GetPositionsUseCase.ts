import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { GetPositionsResponseDTO, PositionResponseDTO, PortfolioSummaryDTO } from "../../dto/trading/PositionDTOs";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { IGetPositionsUseCase } from "../../interface/use-cases/trading/IGetPositionsUseCase";

export class GetPositionsUseCase implements IGetPositionsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(userId: string, filter: "OPEN" | "ALL" = "ALL"): Promise<GetPositionsResponseDTO> {
    const allPositions = await this.positionRepo.findAllPositionsByUserId(userId);
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();

    const sessionPositions = allPositions.filter(
      (pos) => pos.isOpen() || pos.updatedAt >= startOfTodayIst
    );

    let totalInvestment = 0;
    let currentPortfolioValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let openCount = 0;
    let closedCount = 0;

    for (const pos of sessionPositions) {
      if (pos.isOpen()) {
        openCount++;
        const quote = await this.marketDataService.getQuote(pos.symbol);
        const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;
        const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
        const totalCost = +(pos.averagePrice * pos.quantity).toFixed(2);

        totalInvestment += totalCost;
        if (pos.side === PositionSide.LONG) {
          currentPortfolioValue += +(currentLtp * pos.quantity).toFixed(2);
        } else {
          currentPortfolioValue += +(totalCost + unrealizedPnL).toFixed(2);
        }
        totalUnrealizedPnL += unrealizedPnL;
      } else {
        closedCount++;
      }

      totalRealizedPnL += pos.realizedPnL;
    }

    const positionsToReturn =
      filter === "OPEN"
        ? sessionPositions.filter((p) => p.isOpen())
        : sessionPositions;

    const mappedPositions: PositionResponseDTO[] = [];

    for (const pos of positionsToReturn) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

      const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
      const totalPnL = pos.calculateTotalPnL(currentLtp);
      const totalCost = +(pos.averagePrice * pos.quantity).toFixed(2);
      const pnlPercentage =
        totalCost > 0 ? +((unrealizedPnL / totalCost) * 100).toFixed(2) : 0;

      mappedPositions.push({
        id: pos.id,
        userId: pos.userId,
        stockId: pos.stockId,
        symbol: pos.symbol,
        productType: pos.productType,
        side: pos.side,
        quantity: pos.quantity,
        buyQty: pos.buyQty,
        buyAmount: pos.buyAmount,
        sellQty: pos.sellQty,
        sellAmount: pos.sellAmount,
        averagePrice: pos.averagePrice,
        currentLtp,
        unrealizedPnL,
        realizedPnL: pos.realizedPnL,
        totalPnL,
        pnlPercentage,
        blockedMargin: pos.blockedMargin,
        createdAt: pos.createdAt,
        updatedAt: pos.updatedAt,
      });
    }

    const netPnL = +(totalUnrealizedPnL + totalRealizedPnL).toFixed(2);
    const overallReturn =
      totalInvestment > 0 ? +((netPnL / totalInvestment) * 100).toFixed(2) : 0;

    const summary: PortfolioSummaryDTO = {
      totalInvestment: +totalInvestment.toFixed(2),
      currentPortfolioValue: +currentPortfolioValue.toFixed(2),
      totalUnrealizedPnL: +totalUnrealizedPnL.toFixed(2),
      totalRealizedPnL: +totalRealizedPnL.toFixed(2),
      netPnL,
      overallReturnPercentage: overallReturn,
      positionsCount: {
        total: sessionPositions.length,
        open: openCount,
        closed: closedCount,
      },
    };

    return {
      positions: mappedPositions,
      summary,
    };
  }
}

