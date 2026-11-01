import { Request, Response, NextFunction } from "express";
import { IGetUserWatchlistUseCase } from "../../../../application/interface/use-cases/watchlist/IGetUserWatchlistUseCase";
import { IAddToWatchlistUseCase } from "../../../../application/interface/use-cases/watchlist/IAddToWatchlistUseCase";
import { IRemoveFromWatchlistUseCase } from "../../../../application/interface/use-cases/watchlist/IRemoveFromWatchlistUseCase";
import { addToWatchlistSchema, removeFromWatchlistParamsSchema } from "../../validators/WatchlistValidator";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class WatchlistController {
  constructor(
    private readonly _getUserWatchlist: IGetUserWatchlistUseCase,
    private readonly _addToWatchlist: IAddToWatchlistUseCase,
    private readonly _removeFromWatchlist: IRemoveFromWatchlistUseCase
  ) {}

  async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const result = await this._getUserWatchlist.execute({ userId });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.WATCHLIST_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async addToWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validatedBody = addToWatchlistSchema.parse(req.body);

      const result = await this._addToWatchlist.execute({
        userId,
        stockId: validatedBody.stockId,
      });

      ApiResponse.success(
        res,
        HttpStatus.CREATED,
        SuccessMessages.WATCHLIST_ITEM_ADDED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async removeFromWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validatedParams = removeFromWatchlistParamsSchema.parse(req.params);

      const result = await this._removeFromWatchlist.execute({
        userId,
        stockId: validatedParams.stockId,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.WATCHLIST_ITEM_REMOVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}
