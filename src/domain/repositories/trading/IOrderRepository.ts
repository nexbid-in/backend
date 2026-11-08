import { Order, OrderStatus } from "../../entities/trading/Order";

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  findPendingOrdersBySymbol(symbol: string): Promise<Order[]>;
  findPendingOrders(): Promise<Order[]>;
  findPendingAmoOrders(): Promise<Order[]>;
  findByUserId(userId: string, status?: OrderStatus): Promise<Order[]>;
}

