import { PaymentOrder, PaymentStatus } from "../../../domain/entities/PaymentOrder";
import { PaymentOrderPersistenceDTO } from "../../dto/internal/PaymentOrderPersistenceDTO";
import { DecimalLike } from "../../dto/internal/WalletPersistenceDTO";

function toNum(val: DecimalLike): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class PaymentOrderPersistenceMapper {
  static toPrisma(order: PaymentOrder): PaymentOrderPersistenceDTO {
    return {
      id: order.id,
      userId: order.userId,
      orderId: order.orderId,
      paymentId: order.paymentId,
      realAmount: order.realAmount,
      virtualAmount: order.virtualAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  static toDomain(raw: PaymentOrderPersistenceDTO): PaymentOrder {
    return PaymentOrder.create({
      id: raw.id,
      userId: raw.userId,
      orderId: raw.orderId,
      paymentId: raw.paymentId,
      realAmount: toNum(raw.realAmount),
      virtualAmount: toNum(raw.virtualAmount),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
