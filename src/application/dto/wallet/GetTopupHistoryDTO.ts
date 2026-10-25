import { PaymentStatus } from "../../../domain/entities/PaymentOrder";

export type GetTopupHistoryQueryDTO = {
  userId: string;
  page: number;
  limit: number;
  status?: PaymentStatus | "ALL";
  search?: string;
  startDate?: Date;
  endDate?: Date;
};

export type TopupHistoryItemDTO = {
  id: string;
  orderId: string;
  paymentId: string | null;
  realAmount: number;
  virtualAmount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedTopupHistoryResponseDTO = {
  orders: TopupHistoryItemDTO[];
  pagination: {
    page: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  };
};
