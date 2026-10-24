import { PaymentOrder } from "../../entities/PaymentOrder";

export interface IPaymentOrderRepository {
  findById(id: string): Promise<PaymentOrder | null>;
  findByOrderId(orderId: string): Promise<PaymentOrder | null>;
  save(order: PaymentOrder): Promise<void>;
}
