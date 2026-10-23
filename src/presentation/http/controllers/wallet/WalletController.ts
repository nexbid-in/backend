import { Request, Response, NextFunction } from "express";
import { IGetWalletOverviewUseCase } from "../../../../application/interface/use-cases/wallet/IGetWalletOverviewUseCase";
import { IGetWalletStatementUseCase } from "../../../../application/interface/use-cases/wallet/IGetWalletStatementUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { getWalletStatementQuerySchema } from "../../validators/WalletValidator";

export class WalletController {
  constructor(
    private readonly _getWalletOverview: IGetWalletOverviewUseCase,
    private readonly _getWalletStatement: IGetWalletStatementUseCase
  ) {}

  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const overview = await this._getWalletOverview.execute({ userId });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.WALLET_OVERVIEW_RETRIEVED,
        overview
      );
    } catch (error) {
      next(error);
    }
  }

  async getStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validatedQuery = getWalletStatementQuerySchema.parse(req.query);

      const statement = await this._getWalletStatement.execute({
        userId,
        ...validatedQuery,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.WALLET_STATEMENT_RETRIEVED,
        statement
      );
    } catch (error) {
      next(error);
    }
  }
}
