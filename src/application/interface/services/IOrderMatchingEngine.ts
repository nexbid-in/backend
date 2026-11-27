import { Order } from "../../../domain/entities/trading/Order";

/**
 * Abstraction for the trading order book and execution engine.
 */
export interface IOrderMatchingEngine {
  addOrderToBook(order: Order): void;
  removeOrderFromBook(orderId: string, symbol: string): void;
  executeOrder(order: Order, fillPrice: number): Promise<Order>;
}
