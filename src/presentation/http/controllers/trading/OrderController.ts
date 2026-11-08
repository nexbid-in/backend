import { Request, Response, NextFunction } from "express";
import { PlaceOrderUseCase } from "../../../../application/use-cases/trading/PlaceOrderUseCase";
import { GetOrdersUseCase } from "../../../../application/use-cases/trading/GetOrdersUseCase";
import { CancelOrderUseCase } from "../../../../application/use-cases/trading/CancelOrderUseCase";
import { MarketHoursService } from "../../../../application/services/trading/MarketHoursService";
import { env } from "../../../../infrastructure/config/env";
import {
  placeOrderSchema,
  getOrdersQuerySchema,
  cancelOrderParamsSchema,
} from "../../validators/OrderValidator";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class OrderController {
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase
  ) {}

  async placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const body = placeOrderSchema.parse(req.body);

      const order = await this.placeOrderUseCase.execute({
        userId,
        symbol: body.symbol,
        side: body.side,
        orderType: body.orderType,
        productType: body.productType,
        quantity: body.quantity,
        price: body.price,
        triggerPrice: body.triggerPrice,
        isAmo: body.isAmo,
      });

      ApiResponse.success(
        res,
        HttpStatus.CREATED,
        order.isAmo ? SuccessMessages.AMO_ORDER_PLACED : SuccessMessages.ORDER_PLACED,
        order
      );
    } catch (error) {
      next(error);
    }
  }

  async getMarketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);
      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.MARKET_STATUS_RETRIEVED,
        status
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const query = getOrdersQuerySchema.parse(req.query);

      const orders = await this.getOrdersUseCase.execute({
        userId,
        status: query.status,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ORDERS_RETRIEVED,
        orders
      );
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const params = cancelOrderParamsSchema.parse(req.params);

      const order = await this.cancelOrderUseCase.execute({
        userId,
        orderId: params.id,
      });

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.ORDER_CANCELLED,
        order
      );
    } catch (error) {
      next(error);
    }
  }
}

