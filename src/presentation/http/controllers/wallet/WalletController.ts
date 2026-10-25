import { Request, Response, NextFunction } from "express";
import { IGetWalletOverviewUseCase } from "../../../../application/interface/use-cases/wallet/IGetWalletOverviewUseCase";
import { IGetWalletStatementUseCase } from "../../../../application/interface/use-cases/wallet/IGetWalletStatementUseCase";
import { ICreateTopupOrderUseCase } from "../../../../application/interface/use-cases/wallet/ICreateTopupOrderUseCase";
import { IVerifyTopupPaymentUseCase } from "../../../../application/interface/use-cases/wallet/IVerifyTopupPaymentUseCase";
import { IFailTopupPaymentUseCase } from "../../../../application/interface/use-cases/wallet/IFailTopupPaymentUseCase";
import { IGetTopupHistoryUseCase } from "../../../../application/interface/use-cases/wallet/IGetTopupHistoryUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import {
  getWalletStatementQuerySchema,
  createTopupOrderSchema,
  verifyTopupPaymentSchema,
  failTopupPaymentSchema,
  getTopupHistoryQuerySchema,
} from "../../validators/WalletValidator";

export class WalletController {
  constructor(
    private readonly _getWalletOverview: IGetWalletOverviewUseCase,
    private readonly _getWalletStatement: IGetWalletStatementUseCase,
    private readonly _createTopupOrder: ICreateTopupOrderUseCase,
    private readonly _verifyTopupPayment: IVerifyTopupPaymentUseCase,
    private readonly _failTopupPayment: IFailTopupPaymentUseCase,
    private readonly _getTopupHistory: IGetTopupHistoryUseCase
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

  async createTopupOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validated = createTopupOrderSchema.parse(req.body);

      const result = await this._createTopupOrder.execute({
        userId,
        realAmount: validated.realAmount,
      });

      ApiResponse.success(
        res,
        HttpStatus.CREATED,
        SuccessMessages.ORDER_CREATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyTopupPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validated = verifyTopupPaymentSchema.parse(req.body);

      const result = await this._verifyTopupPayment.execute({
        userId,
        ...validated,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.PAYMENT_VERIFIED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async failPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validated = failTopupPaymentSchema.parse(req.body);

      const result = await this._failTopupPayment.execute({
        userId,
        ...validated,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.PAYMENT_FAILED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async getTopupHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validatedQuery = getTopupHistoryQuerySchema.parse(req.query);

      const history = await this._getTopupHistory.execute({
        userId,
        ...validatedQuery,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.TOPUP_HISTORY_RETRIEVED,
        history
      );
    } catch (error) {
      next(error);
    }
  }
}


