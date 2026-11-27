import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { GetPositionsResponseDTO, PositionResponseDTO, PortfolioSummaryDTO } from "../../dto/trading/PositionDTOs";
import { ProductType } from "../../../domain/entities/trading/Position";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { IGetPositionsUseCase } from "../../interface/use-cases/trading/IGetPositionsUseCase";
import { Money } from "../../../domain/value-objects/Money";

export class GetPositionsUseCase implements IGetPositionsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(userId: string, filter: "OPEN" | "ALL" | "CLOSED" = "ALL"): Promise<GetPositionsResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();
    const [allPositions, todayTrades] = await Promise.all([
      this.positionRepo.findAllPositionsByUserId(userId),
      this.tradeRepo.findByUserId(userId, { from: startOfTodayIst }),
    ]);

    const todayRealizedByKey = new Map<string, Money>();
    let totalRealizedPnL = Money.zero();

    for (const trade of todayTrades) {
      if (trade.productType === ProductType.MIS) {
        const key = `${trade.symbol}:${trade.productType}`;
        const prev = todayRealizedByKey.get(key) ?? Money.zero();
        todayRealizedByKey.set(key, prev.add(trade.realizedPnL));
        totalRealizedPnL = totalRealizedPnL.add(trade.realizedPnL);
      }
    }

    const sessionPositions = allPositions.filter(
      (pos) =>
        pos.productType === ProductType.MIS &&
        (pos.isOpen() || pos.updatedAt >= startOfTodayIst)
    );

    let totalUnrealizedPnL = 0;
    let openCount = 0;
    let closedCount = 0;

    for (const pos of sessionPositions) {
      if (pos.isOpen()) {
        openCount++;
        const quote = await this.marketDataService.getQuote(pos.symbol);
        const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;
        const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
        totalUnrealizedPnL += unrealizedPnL;
      } else {
        closedCount++;
      }
    }

    const positionsToReturn =
      filter === "OPEN"
        ? sessionPositions.filter((p) => p.isOpen())
        : filter === "CLOSED"
        ? sessionPositions.filter((p) => !p.isOpen())
        : sessionPositions;

    const mappedPositions: PositionResponseDTO[] = [];

    for (const pos of positionsToReturn) {
      const quote = await this.marketDataService.getQuote(pos.symbol);
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

      const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
      const realizedPnL = todayRealizedByKey.get(`${pos.symbol}:${pos.productType}`)?.toNumber() ?? 0;
      const totalPnL = +(realizedPnL + unrealizedPnL).toFixed(2);
      const totalCost = +(pos.averagePrice * pos.quantity).toFixed(2);
      const pnlPercentage =
        totalCost > 0 ? +((unrealizedPnL / totalCost) * 100).toFixed(2) : 0;

      mappedPositions.push({
        id: pos.id,
        symbol: pos.symbol,
        productType: pos.productType,
        side: pos.side,
        quantity: pos.quantity,
        averagePrice: pos.averagePrice,
        currentLtp,
        unrealizedPnL,
        realizedPnL,
        totalPnL,
        pnlPercentage,
        updatedAt: pos.updatedAt,
      });
    }

    const realizedPnLNum = totalRealizedPnL.toNumber();
    const netPnL = +(totalUnrealizedPnL + realizedPnLNum).toFixed(2);

    const summary: PortfolioSummaryDTO = {
      totalRealizedPnL: realizedPnLNum,
      totalUnrealizedPnL: +totalUnrealizedPnL.toFixed(2),
      netPnL,
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

