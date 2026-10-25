import { PaymentOrder, PaymentStatus } from "../../entities/PaymentOrder";
import { PaginatedResult } from "../user/IUserRepository";

export interface PaymentOrderQueryOptions {
  userId: string;
  page: number;
  limit: number;
  status?: PaymentStatus | "ALL";
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IPaymentOrderRepository {
  findById(id: string): Promise<PaymentOrder | null>;
  findByOrderId(orderId: string): Promise<PaymentOrder | null>;
  save(order: PaymentOrder): Promise<void>;
  findHistory(options: PaymentOrderQueryOptions): Promise<PaginatedResult<PaymentOrder>>;
}

