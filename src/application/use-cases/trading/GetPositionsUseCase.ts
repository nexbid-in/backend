import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { GetPositionsResponseDTO, PositionResponseDTO, PortfolioSummaryDTO } from "../../dto/trading/PositionDTOs";
import { PositionSide } from "../../../domain/entities/trading/Position";

export class GetPositionsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(userId: string, filter: "OPEN" | "ALL" = "ALL"): Promise<GetPositionsResponseDTO> {
    const rawPositions =
      filter === "OPEN"
        ? await this.positionRepo.findOpenPositionsByUserId(userId)
        : await this.positionRepo.findAllPositionsByUserId(userId);

    let totalInvestment = 0;
    let currentPortfolioValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let openCount = 0;
    let closedCount = 0;

    const mappedPositions: PositionResponseDTO[] = [];

    for (const pos of rawPositions) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

      const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
      const totalPnL = pos.calculateTotalPnL(currentLtp);
      const totalCost = +(pos.averagePrice * pos.quantity).toFixed(2);
      const pnlPercentage =
        totalCost > 0 ? +((unrealizedPnL / totalCost) * 100).toFixed(2) : 0;

      if (pos.isOpen()) {
        openCount++;
        totalInvestment += totalCost;
        if (pos.side === PositionSide.LONG) {
          currentPortfolioValue += +(currentLtp * pos.quantity).toFixed(2);
        } else {
          // Short position: current value reflects initial short proceeds minus floating move
          currentPortfolioValue += +(totalCost + unrealizedPnL).toFixed(2);
        }
        totalUnrealizedPnL += unrealizedPnL;
      } else {
        closedCount++;
      }

      totalRealizedPnL += pos.realizedPnL;

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
        total: rawPositions.length,
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

