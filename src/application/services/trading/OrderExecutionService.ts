import { Order, OrderType } from "../../../domain/entities/trading/Order";
import { IMarketStreamService } from "../../interface/services/IMarketDataService";
import { IOrderMatchingEngine } from "../../interface/services/IOrderMatchingEngine";
import { MarketStatusInfo } from "./MarketHoursService";

/**
 * Dispatches validated orders for immediate market execution or resting order-book placement.
 */
export class OrderExecutionService {
  constructor(
    private readonly matchingEngine: IOrderMatchingEngine,
    private readonly marketStream: IMarketStreamService
  ) {}

  async dispatchOrder(
    order: Order,
    referencePrice: number,
    marketStatus: MarketStatusInfo
  ): Promise<Order> {
    const canExecuteImmediately =
      order.orderType === OrderType.MARKET &&
      !order.isAmo &&
      (!marketStatus.enforceMarketHours || marketStatus.isOpen);

    if (canExecuteImmediately) {
      return await this.matchingEngine.executeOrder(order, referencePrice);
    }

    this.matchingEngine.addOrderToBook(order);
    await this.marketStream.subscribe([order.symbol]);
    return order;
  }
}
