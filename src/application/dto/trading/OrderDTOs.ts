import { OrderSide, OrderType, ProductType, OrderStatus } from "../../../domain/entities/trading/Order";

export interface PlaceOrderRequestDTO {
  userId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  productType: ProductType;
  quantity: number;
  price?: number | null;
  triggerPrice?: number | null;
  isAmo?: boolean;
}

export interface OrderResponseDTO {
  id: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  productType: ProductType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  price: number | null;
  averagePrice: number | null;
  rejectionReason: string | null;
  blockedMargin: number;
  isAmo: boolean;
  createdAt: Date;
}

export interface GetOrdersRequestDTO {
  userId: string;
  status?: OrderStatus;
  scope?: "TODAY" | "ALL";
}

export interface CancelOrderRequestDTO {
  userId: string;
  orderId: string;
}

