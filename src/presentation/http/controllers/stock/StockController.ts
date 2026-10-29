import { Request, Response, NextFunction } from "express";
import { ISearchStocksUseCase } from "../../../../application/interface/use-cases/watchlist/ISearchStocksUseCase";
import { searchStocksQuerySchema } from "../../validators/WatchlistValidator";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";

export class StockController {
  constructor(private readonly _searchStocks: ISearchStocksUseCase) {}

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = searchStocksQuerySchema.parse(req.query);

      const result = await this._searchStocks.execute({
        query: validatedQuery.q,
        limit: validatedQuery.limit,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.STOCKS_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}
