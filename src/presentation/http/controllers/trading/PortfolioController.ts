import { Request, Response, NextFunction } from "express";
import { GetPositionsUseCase } from "../../../../application/use-cases/trading/GetPositionsUseCase";
import { GetHoldingsUseCase } from "../../../../application/use-cases/trading/GetHoldingsUseCase";
import { SquareOffPositionUseCase } from "../../../../application/use-cases/trading/SquareOffPositionUseCase";
import { GetPnlStatementUseCase } from "../../../../application/use-cases/trading/GetPnlStatementUseCase";
import { GetTradebookUseCase } from "../../../../application/use-cases/trading/GetTradebookUseCase";
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
    private readonly getPositionsUseCase: GetPositionsUseCase,
    private readonly getHoldingsUseCase: GetHoldingsUseCase,
    private readonly squareOffUseCase: SquareOffPositionUseCase,
    private readonly getPnlStatementUseCase: GetPnlStatementUseCase,
    private readonly getTradebookUseCase: GetTradebookUseCase
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

