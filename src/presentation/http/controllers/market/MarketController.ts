import { Request, Response, NextFunction } from "express";
import { IGetHistoricalCandlesUseCase } from "../../../../application/interface/use-cases/market/IGetHistoricalCandlesUseCase";
import { IGetStockOverviewUseCase } from "../../../../application/interface/use-cases/market/IGetStockOverviewUseCase";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import {
  getHistoricalCandlesQuerySchema,
  getStockOverviewParamsSchema,
} from "../../validators/MarketValidator";

export class MarketController {
  constructor(
    private readonly _getCandlesUseCase: IGetHistoricalCandlesUseCase,
    private readonly _getStockOverviewUseCase: IGetStockOverviewUseCase
  ) {}

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getHistoricalCandlesQuerySchema.parse(req.query);

      const candles = await this._getCandlesUseCase.execute({
        symbol: query.symbol,
        resolution: query.resolution,
        from: query.from ?? 0,
        to: query.to ?? 0,
      });

      ApiResponse.success(res, HttpStatus.OK, "Historical data fetched", candles);
    } catch (error) {
      next(error);
    }
  }

  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = getStockOverviewParamsSchema.parse(req.params);

      const overview = await this._getStockOverviewUseCase.execute({ symbol });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        "Stock overview fetched successfully",
        overview
      );
    } catch (error) {
      next(error);
    }
  }
}

