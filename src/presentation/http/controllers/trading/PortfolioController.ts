import { Request, Response, NextFunction } from "express";
import { IGetPositionsUseCase } from "../../../../application/interface/use-cases/trading/IGetPositionsUseCase";
import { IGetHoldingsUseCase } from "../../../../application/interface/use-cases/trading/IGetHoldingsUseCase";
import { ISquareOffPositionUseCase } from "../../../../application/interface/use-cases/trading/ISquareOffPositionUseCase";
import { IGetPnlStatementUseCase } from "../../../../application/interface/use-cases/trading/IGetPnlStatementUseCase";
import { IGetTradebookUseCase } from "../../../../application/interface/use-cases/trading/IGetTradebookUseCase";
import {
  getPositionsQuerySchema,
  squareOffParamsSchema,
  getPnlQuerySchema,
  getTradebookQuerySchema,
} from "../../validators/OrderValidator";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class PortfolioController {
  constructor(
    private readonly getPositionsUseCase: IGetPositionsUseCase,
    private readonly getHoldingsUseCase: IGetHoldingsUseCase,
    private readonly squareOffUseCase: ISquareOffPositionUseCase,
    private readonly getPnlStatementUseCase: IGetPnlStatementUseCase,
    private readonly getTradebookUseCase: IGetTradebookUseCase
  ) {}

  async getPositions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const query = getPositionsQuerySchema.parse(req.query);

      const result = await this.getPositionsUseCase.execute(userId, query.filter);

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.POSITIONS_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const result = await this.getHoldingsUseCase.execute(userId);

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.HOLDINGS_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getPnlStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const query = getPnlQuerySchema.parse(req.query);

      const result = await this.getPnlStatementUseCase.execute(userId, query);

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.PNL_STATEMENT_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getTradebook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const query = getTradebookQuerySchema.parse(req.query);

      const result = await this.getTradebookUseCase.execute(userId, query);

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.TRADEBOOK_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async squareOffPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const params = squareOffParamsSchema.parse(req.params);

      const result = await this.squareOffUseCase.execute({
        userId,
        positionId: params.id,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.POSITION_SQUARED_OFF,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}

