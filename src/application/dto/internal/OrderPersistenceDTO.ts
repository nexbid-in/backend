import { OrderSide, OrderType, ProductType, OrderStatus } from "../../../domain/entities/trading/Order";
import { Prisma } from "../../../infrastructure/database/generated/prisma/client";

export type DecimalLike = Prisma.Decimal | number | string;

export interface OrderPersistenceDTO {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  productType: ProductType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  price: DecimalLike | null;
  averagePrice: DecimalLike | null;
  triggerPrice: DecimalLike | null;
  rejectionReason: string | null;
  blockedMargin: DecimalLike;
  isAmo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
