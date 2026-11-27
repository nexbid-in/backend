import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { HoldingsValuationCalculator } from "../../../domain/services/trading/HoldingsValuationCalculator";
import { GetHoldingsResponseDTO } from "../../dto/trading/HoldingDTOs";
import { IGetHoldingsUseCase } from "../../interface/use-cases/trading/IGetHoldingsUseCase";
import { HoldingDTOMapper } from "../../mapper/trading/HoldingDTOMapper";
import { MarketQuoteBatchService } from "../../services/market/MarketQuoteBatchService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";

/**
 * Orchestrates fetching CNC delivery holdings, batch-loading live market quotes,
 * delegating valuation math to HoldingsValuationCalculator, and mapping the DTO response.
 */
export class GetHoldingsUseCase implements IGetHoldingsUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly quoteBatchService: MarketQuoteBatchService
  ) {}

  async execute(userId: string): Promise<GetHoldingsResponseDTO> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();
    const allPositions =
      await this.positionRepo.findAllPositionsByUserId(userId);

    const { active, exitedToday } = HoldingsValuationCalculator.selectHoldings(
      allPositions,
      startOfTodayIst
    );

    const quotesBySymbol = await this.quoteBatchService.fetchQuotes(
      [...active, ...exitedToday].map((pos) => pos.symbol)
    );

    const evaluation = HoldingsValuationCalculator.evaluate({
      positions: allPositions,
      quotesBySymbol,
      startOfTodayIst,
    });

    return HoldingDTOMapper.toDTO(evaluation);
  }
}
