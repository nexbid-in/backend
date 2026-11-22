import { Request, Response, NextFunction } from "express";
import { IGetAdminOrdersUseCase } from "../../../../application/interface/use-cases/admin/IGetAdminOrdersUseCase";
import { IGetAdminOrderMetricsUseCase } from "../../../../application/interface/use-cases/admin/IGetAdminOrderMetricsUseCase";
import { IGetAdminOrderDetailsUseCase } from "../../../../application/interface/use-cases/admin/IGetAdminOrderDetailsUseCase";
import { IAdminCancelOrderUseCase } from "../../../../application/interface/use-cases/admin/IAdminCancelOrderUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  getAdminOrdersSchema,
  getAdminOrderDetailsSchema,
  adminCancelOrderSchema,
} from "../../validators/AdminValidator";

export class AdminOrderController {
  constructor(
    private readonly getOrdersUseCase: IGetAdminOrdersUseCase,
    private readonly getOrderMetricsUseCase: IGetAdminOrderMetricsUseCase,
    private readonly getOrderDetailsUseCase: IGetAdminOrderDetailsUseCase,
    private readonly cancelOrderUseCase: IAdminCancelOrderUseCase
  ) {}

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getAdminOrdersSchema.parse(req.query);
      const result = await this.getOrdersUseCase.execute(validatedQuery);
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.ORDERS_RETRIEVED, result);
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.getOrderMetricsUseCase.execute();
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.ORDER_METRICS_RETRIEVED, result);
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = getAdminOrderDetailsSchema.parse(req.params);
      const result = await this.getOrderDetailsUseCase.execute(orderId);
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.ORDER_DETAILS_RETRIEVED, result);
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = adminCancelOrderSchema.parse(req.params);
      const result = await this.cancelOrderUseCase.execute({ orderId });
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.ORDER_CANCELLED, result);
    } catch (error) {
      next(error);
    }
  }
}
