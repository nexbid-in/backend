import { Request, Response, NextFunction } from "express";
import { GetPositionsUseCase } from "../../../../application/use-cases/trading/GetPositionsUseCase";
import { SquareOffPositionUseCase } from "../../../../application/use-cases/trading/SquareOffPositionUseCase";
import {
  getPositionsQuerySchema,
  squareOffParamsSchema,
} from "../../validators/OrderValidator";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class PortfolioController {
  constructor(
    private readonly getPositionsUseCase: GetPositionsUseCase,
    private readonly squareOffUseCase: SquareOffPositionUseCase
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

