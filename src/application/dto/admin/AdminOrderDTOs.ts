import {
  OrderSide,
  OrderStatus,
  OrderType,
  ProductType,
} from "../../../domain/entities/trading/Order";

export type AdminOrdersQueryDTO = {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus | "ALL";
  side?: OrderSide | "ALL";
  productType?: ProductType | "ALL";
  isAmo?: boolean;
  startDate?: string;
  endDate?: string;
};

export type AdminOrderListItemDTO = {
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
};

export type PaginatedAdminOrdersResponseDTO = {
  orders: AdminOrderListItemDTO[];
  pagination: {
    page: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  };
};

export type AdminOrderMetricsDTO = {
  todayOrdersCount: number;
  todayTurnover: number;
  pendingAmoCount: number;
  todayExecutedCount: number;
  todayRejectedCount: number;
  todayCancelledCount: number;
};

export type AdminOrderTradeDTO = {
  id: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: number;
  tradeValue: number;
  realizedPnL: number;
  executedAt: Date;
};

export type AdminOrderDetailsDTO = {
  id: string;
  userId: string;
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
  stockId: string;
  symbol: string;
  stock: {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
    sector: string | null;
    type: string;
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
  trades: AdminOrderTradeDTO[];
};

export type AdminCancelOrderDTO = {
  orderId: string;
};
