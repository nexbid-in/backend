import { IGetStockOverviewUseCase } from "../../interface/use-cases/market/IGetStockOverviewUseCase";
import {
  GetStockOverviewRequestDTO,
  StockOverviewResponseDTO,
} from "../../dto/market/StockOverviewDTO";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IStockStatsCacheService } from "../../interface/services/IStockStatsCacheService";
import { ILogger } from "../../interface/services/ILogger";
import {
  StockOverviewStats,
  StockPerformanceCalculator,
  StockPerformanceReturns,
  StockRange52W,
  StockVitals,
} from "../../../domain/services/market/StockPerformanceCalculator";
import { StockOverviewDTOMapper } from "../../mapper/market/StockOverviewDTOMapper";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

/**
 * Orchestrates fetching stock metadata, live market feeds, and cached/historical overview analytics.
 */
export class GetStockOverviewUseCase implements IGetStockOverviewUseCase {
  private static readonly DAY_MS = 24 * 60 * 60 * 1000;

  constructor(
    private readonly _stockRepository: IStockRepository,
    private readonly _marketDataService: IMarketDataService,
    private readonly _statsCacheService: IStockStatsCacheService,
    private readonly _logger: ILogger
  ) {}

  async execute(data: GetStockOverviewRequestDTO): Promise<StockOverviewResponseDTO> {
    const cleanSymbol = data.symbol.toUpperCase().trim();

    const stock = await this._stockRepository.findBySymbol(cleanSymbol);
    if (!stock) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    const [quote, depth] = await Promise.all([
      this._marketDataService.getQuote(cleanSymbol),
      this._marketDataService.getMarketDepth
        ? this._marketDataService.getMarketDepth(cleanSymbol)
        : Promise.resolve(null),
    ]);

    const vitals = StockPerformanceCalculator.buildVitals(quote, depth);
    const { range52W, performance } = await this.resolveStats(cleanSymbol, vitals);

    return StockOverviewDTOMapper.toDTO({
      stock,
      vitals,
      range52W,
      performance,
      lastUpdated: quote?.timestamp ?? Date.now(),
    });
  }

  private async resolveStats(
    symbol: string,
    vitals: StockVitals
  ): Promise<{ range52W: StockRange52W; performance: StockPerformanceReturns }> {
    const now = Date.now();
    const todayIstKey = StockPerformanceCalculator.toIstDateKey(now);

    const cachedStats = await this._statsCacheService.getOverviewStats(
      symbol,
      todayIstKey
    );
    if (cachedStats) {
      return StockPerformanceCalculator.applyLiveVitalsToStats(cachedStats, vitals);
    }

    const lookbackStart =
      now - StockPerformanceCalculator.LOOKBACK_DAYS * GetStockOverviewUseCase.DAY_MS;
    let stats: StockOverviewStats = StockPerformanceCalculator.buildDefaultStats(vitals);

    try {
      const candles = await this._marketDataService.getHistoricalCandles(
        symbol,
        "D",
        lookbackStart,
        now
      );

      if (candles && candles.length > 0) {
        stats = StockPerformanceCalculator.calculateStatsFromCandles(
          candles,
          vitals,
          now
        );
        await this._statsCacheService.setOverviewStats(symbol, todayIstKey, stats);
      }
    } catch (err) {
      this._logger.warn(
        { symbol, err },
        "Failed to fetch historical candles for overview stats"
      );
    }

    return StockPerformanceCalculator.applyLiveVitalsToStats(stats, vitals);
  }
}
