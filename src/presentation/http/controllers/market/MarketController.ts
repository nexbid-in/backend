import { Request, Response, NextFunction } from "express";
import { IGetHistoricalCandlesUseCase } from "../../../../application/interface/use-cases/market/IGetHistoricalCandlesUseCase";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { getHistoricalCandlesQuerySchema } from "../../validators/MarketValidator";

export class MarketController {
    constructor(private readonly _getCandlesUseCase: IGetHistoricalCandlesUseCase) { }

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
}
