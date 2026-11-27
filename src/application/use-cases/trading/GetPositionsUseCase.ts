import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { PositionsValuationCalculator } from "../../../domain/services/trading/PositionsValuationCalculator";
import { GetPositionsResponseDTO } from "../../dto/trading/PositionDTOs";
import { IGetPositionsUseCase } from "../../interface/use-cases/trading/IGetPositionsUseCase";
import { PositionDTOMapper } from "../../mapper/trading/PositionDTOMapper";
import { MarketQuoteBatchService } from "../../services/market/MarketQuoteBatchService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";

/**
 * Orchestrates fetching intraday MIS positions and today's trades, batch-loading
 * deduplicated live quotes, delegating P&L valuation, and filtering/mapping the response.
 */
export class GetPositionsUseCase implements IGetPositionsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly quoteBatchService: MarketQuoteBatchService
  ) {}

  async execute(
    userId: string,
    filter: "OPEN" | "ALL" | "CLOSED" = "ALL"
  ): Promise<GetPositionsResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();
    const [allPositions, todayTrades] = await Promise.all([
      this.positionRepo.findAllPositionsByUserId(userId),
      this.tradeRepo.findByUserId(userId, { from: startOfTodayIst }),
    ]);

    const sessionPositions =
      PositionsValuationCalculator.selectSessionPositions(
        allPositions,
        startOfTodayIst
      );

    const quotesBySymbol = await this.quoteBatchService.fetchQuotes(
      sessionPositions.map((pos) => pos.symbol)
    );

    const evaluation = PositionsValuationCalculator.evaluate({
      sessionPositions,
      todayTrades,
      quotesBySymbol,
    });

    return PositionDTOMapper.toDTO(evaluation, filter);
  }
}
