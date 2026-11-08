import { Order } from "../../../domain/entities/trading/Order";
import { OrderPersistenceDTO, DecimalLike } from "../../dto/internal/OrderPersistenceDTO";

function toNum(val: DecimalLike | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class OrderPersistenceMapper {
  static toPrisma(order: Order): OrderPersistenceDTO {
    return {
      id: order.id,
      userId: order.userId,
      stockId: order.stockId,
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      productType: order.productType,
      status: order.status,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
      price: order.price,
      averagePrice: order.averagePrice,
      triggerPrice: order.triggerPrice,
      rejectionReason: order.rejectionReason,
      blockedMargin: order.blockedMargin,
      isAmo: order.isAmo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toDomain(raw: OrderPersistenceDTO): Order {
    return Order.create({
      id: raw.id,
      userId: raw.userId,
      stockId: raw.stockId,
      symbol: raw.symbol,
      side: raw.side,
      orderType: raw.orderType,
      productType: raw.productType,
      status: raw.status,
      quantity: raw.quantity,
      filledQuantity: raw.filledQuantity,
      price: toNum(raw.price),
      averagePrice: toNum(raw.averagePrice),
      triggerPrice: toNum(raw.triggerPrice),
      rejectionReason: raw.rejectionReason,
      blockedMargin: toNum(raw.blockedMargin) ?? 0,
      isAmo: Boolean(raw.isAmo),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}

