import { Request, Response, NextFunction } from "express";
import { IGetAdminStocksUseCase } from "../../../../application/interface/use-cases/admin/IGetAdminStocksUseCase";
import { ICreateStockUseCase } from "../../../../application/interface/use-cases/admin/ICreateStockUseCase";
import { IUpdateStockStatusUseCase } from "../../../../application/interface/use-cases/admin/IUpdateStockStatusUseCase";
import { IUpdateStockUseCase } from "../../../../application/interface/use-cases/admin/IUpdateStockUseCase";
import { IDeleteStockUseCase } from "../../../../application/interface/use-cases/admin/IDeleteStockUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  getAdminStocksSchema,
  createStockSchema,
  updateStockStatusSchema,
  updateStockSchema,
  stockIdParamSchema,
} from "../../validators/AdminStockValidator";

export class AdminStockController {
  constructor(
    private readonly getAdminStocksUseCase: IGetAdminStocksUseCase,
    private readonly createStockUseCase: ICreateStockUseCase,
    private readonly updateStockStatusUseCase: IUpdateStockStatusUseCase,
    private readonly updateStockUseCase: IUpdateStockUseCase,
    private readonly deleteStockUseCase: IDeleteStockUseCase
  ) {}

  async getStocks(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getAdminStocksSchema.parse(req.query);
      const result = await this.getAdminStocksUseCase.execute(validatedQuery);
      return ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ADMIN_STOCKS_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async createStock(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedBody = createStockSchema.parse(req.body);
      const result = await this.createStockUseCase.execute(validatedBody);
      return ApiResponse.success(
        res,
        HttpStatus.CREATED,
        SuccessMessages.ADMIN_STOCK_CREATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async updateStockStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { stockId } = stockIdParamSchema.parse(req.params);
      const validatedBody = updateStockStatusSchema.parse(req.body);
      const result = await this.updateStockStatusUseCase.execute({
        stockId,
        ...validatedBody,
      });
      return ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ADMIN_STOCK_STATUS_UPDATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { stockId } = stockIdParamSchema.parse(req.params);
      const validatedBody = updateStockSchema.parse(req.body);
      const result = await this.updateStockUseCase.execute({
        stockId,
        ...validatedBody,
      });
      return ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ADMIN_STOCK_UPDATED,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { stockId } = stockIdParamSchema.parse(req.params);
      await this.deleteStockUseCase.execute({ stockId });
      return ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ADMIN_STOCK_DELETED,
        null
      );
    } catch (error) {
      next(error);
    }
  }
}
