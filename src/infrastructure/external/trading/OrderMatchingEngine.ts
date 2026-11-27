import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { ILogger } from "../../../application/interface/services/ILogger";
import { IMarketStreamService } from "../../../application/interface/services/IMarketDataService";
import { IOrderMatchingEngine } from "../../../application/interface/services/IOrderMatchingEngine";
import { OrderTradeExecutionService } from "../../../application/services/trading/OrderTradeExecutionService";
import { Order, OrderSide } from "../../../domain/entities/trading/Order";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

/**
 * In-memory limit order book and real-time tick matcher.
 * Delegates matched or immediate order fulfillment to OrderTradeExecutionService.
 */
export class OrderMatchingEngine implements IOrderMatchingEngine {
  private orderBook = new Map<string, Order[]>();
  private executingOrderIds = new Set<string>();

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly marketStream: IMarketStreamService,
    private readonly tradeExecutionService: OrderTradeExecutionService,
    private readonly logger: ILogger
  ) {}

  public async start(): Promise<void> {
    try {
      const pendingOrders = await this.orderRepo.findPendingOrders();
      const symbolsToSubscribe = new Set<string>();

      for (const order of pendingOrders) {
        this.addOrderToBook(order);
        symbolsToSubscribe.add(order.symbol);
      }

      this.logger.info(
        {
          pendingCount: pendingOrders.length,
          symbols: Array.from(symbolsToSubscribe),
        },
        "Virtual Order Matching Engine hydrated in-memory order book from database"
      );

      if (symbolsToSubscribe.size > 0) {
        await this.marketStream.subscribe(Array.from(symbolsToSubscribe));
      }
    } catch (err) {
      this.logger.error(
        { err },
        "Failed to hydrate order book on matching engine startup"
      );
    }

    this.marketStream.onTick((tick) => {
      void this.processTick(tick);
    });
    this.logger.info(
      {},
      "Virtual Order Matching Engine started and listening to market ticks"
    );
  }

  public addOrderToBook(order: Order): void {
    const sym = order.symbol.toUpperCase().trim();
    const existing = this.orderBook.get(sym) ?? [];
    if (!existing.some((o) => o.id === order.id)) {
      existing.push(order);
      this.orderBook.set(sym, existing);
      this.logger.info(
        { orderId: order.id, symbol: sym, price: order.price, side: order.side },
        "Added pending order to in-memory limit order book"
      );
    }
  }

  public removeOrderFromBook(orderId: string, symbol: string): void {
    const sym = symbol.toUpperCase().trim();
    const existing = this.orderBook.get(sym);
    if (!existing) return;

    const filtered = existing.filter((o) => o.id !== orderId);
    if (filtered.length > 0) {
      this.orderBook.set(sym, filtered);
    } else {
      this.orderBook.delete(sym);
    }
  }

  public async executeOrder(order: Order, fillPrice: number): Promise<Order> {
    const executedOrder = await this.tradeExecutionService.executeOrder(
      order,
      fillPrice
    );
    this.removeOrderFromBook(order.id, order.symbol);
    return executedOrder;
  }

  public async processTick(tick: MarketTick): Promise<void> {
    const sym = tick.symbol.toUpperCase().trim();
    const orders = this.orderBook.get(sym);
    if (!orders || orders.length === 0) return;

    for (const order of [...orders]) {
      if (!order.isPending() || !order.price) continue;
      if (this.executingOrderIds.has(order.id)) continue;

      const executionPrice = this.resolveMatchedExecutionPrice(order, tick.ltp);
      if (executionPrice === null) continue;

      this.executingOrderIds.add(order.id);
      this.removeOrderFromBook(order.id, sym);

      try {
        this.logger.info(
          {
            orderId: order.id,
            symbol: sym,
            side: order.side,
            limitPrice: order.price,
            tickLtp: tick.ltp,
            executionPrice,
          },
          "Limit order condition satisfied! Executing trade"
        );
        await this.executeOrder(order, executionPrice);
      } catch (execErr) {
        this.logger.error(
          { execErr, orderId: order.id, symbol: sym },
          "Failed to execute matched limit order"
        );
        this.addOrderToBook(order);
      } finally {
        this.executingOrderIds.delete(order.id);
      }
    }
  }

  private resolveMatchedExecutionPrice(
    order: Order,
    tickLtp: number
  ): number | null {
    if (!order.price) {
      return null;
    }

    if (order.side === OrderSide.BUY && tickLtp <= order.price) {
      return Math.min(order.price, tickLtp);
    }

    if (order.side === OrderSide.SELL && tickLtp >= order.price) {
      return Math.max(order.price, tickLtp);
    }

    return null;
  }
}
