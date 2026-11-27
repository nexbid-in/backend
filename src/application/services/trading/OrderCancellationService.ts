import { Order } from "../../../domain/entities/trading/Order";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IOrderMatchingEngine } from "../../interface/services/IOrderMatchingEngine";
import { OrderMarginService } from "./OrderMarginService";

/**
 * Shared application service for cancelling pending orders, removing them from
 * the order book, and releasing any blocked margin.
 */
export class OrderCancellationService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly marginService: OrderMarginService,
    private readonly matchingEngine: IOrderMatchingEngine
  ) {}

  async cancelOrder(order: Order, reason?: string): Promise<Order> {
    if (!order.canBeCancelled()) {
      throw new AppError(ErrorCodes.ORDER_CANNOT_BE_CANCELLED);
    }

    order.markCancelled(reason);
    await this.orderRepo.update(order);

    this.matchingEngine.removeOrderFromBook(order.id, order.symbol);

    if (order.blockedMargin > 0) {
      await this.marginService.releaseMargin(order.userId, order.blockedMargin);
    }

    return order;
  }
}
