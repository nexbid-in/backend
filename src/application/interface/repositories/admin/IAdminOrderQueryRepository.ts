import {
  OrderSide,
  OrderStatus,
  OrderType,
  ProductType,
} from "../../../../domain/entities/trading/Order";

export interface AdminOrderFilterOptions {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus | "ALL";
  side?: OrderSide | "ALL";
  productType?: ProductType | "ALL";
  isAmo?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface AdminOrderWithRelations {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
  stockId: string;
  symbol: string;
  stock: {
    symbol: string;
    name: string;
    exchange: string;
  };
  side: OrderSide;
  orderType: OrderType;
  productType: ProductType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  price: number | null;
  averagePrice: number | null;
  triggerPrice: number | null;
  rejectionReason: string | null;
  blockedMargin: number;
  isAmo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminOrderMetrics {
  todayOrdersCount: number;
  todayTurnover: number;
  pendingAmoCount: number;
  todayExecutedCount: number;
  todayRejectedCount: number;
  todayCancelledCount: number;
}

export interface AdminOrderTradeDetails {
  id: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: number;
  tradeValue: number;
  realizedPnL: number;
  executedAt: Date;
}

export interface AdminOrderDetailsWithRelations extends AdminOrderWithRelations {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string | null;
    profileImage: string | null;
    isBlocked: boolean;
    createdAt: Date;
    walletBalance: number;
  };
  stock: {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
    sector: string | null;
    type: string;
  };
  trades: AdminOrderTradeDetails[];
}

export interface PaginatedAdminOrdersResult {
  data: AdminOrderWithRelations[];
  total: number;
}

/**
 * Dedicated admin read-model query repository for filtered orders, order metrics, and order detail projections.
 */
export interface IAdminOrderQueryRepository {
  findManyWithFilters(
    options: AdminOrderFilterOptions
  ): Promise<PaginatedAdminOrdersResult>;
  getAggregateMetrics(): Promise<AdminOrderMetrics>;
  findDetailsById(id: string): Promise<AdminOrderDetailsWithRelations | null>;
}
