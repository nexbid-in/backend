import { OrderMatchingEngine } from "../../../infrastructure/external/trading/OrderMatchingEngine";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { Order, OrderType } from "../../../domain/entities/trading/Order";
import { MarketStatusInfo } from "./MarketHoursService";
import { env } from "../../../infrastructure/config/env";

export class OrderExecutionService {
  constructor(
    private readonly matchingEngine: OrderMatchingEngine,
    private readonly marketDataService: IMarketDataService
  ) {}

  async dispatchOrder(
    order: Order,
    referencePrice: number,
    marketStatus: MarketStatusInfo
  ): Promise<Order> {
    const canExecuteImmediately =
      order.orderType === OrderType.MARKET &&
      !order.isAmo &&
      (!env.ENFORCE_MARKET_HOURS || marketStatus.isOpen);

    if (canExecuteImmediately) {
      return await this.matchingEngine.executeOrder(order, referencePrice);
    }

    this.matchingEngine.addOrderToBook(order);
    await this.marketDataService.subscribe([order.symbol]);
    return order;
  }
}
