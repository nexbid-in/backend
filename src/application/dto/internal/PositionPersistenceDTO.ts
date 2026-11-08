import { ProductType, PositionSide } from "../../../domain/entities/trading/Position";
import { Prisma } from "../../../infrastructure/database/generated/prisma/client";

export type DecimalLike = Prisma.Decimal | number | string;

export interface PositionPersistenceDTO {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  productType: ProductType;
  side: PositionSide;
  quantity: number;
  buyQty: number;
  buyAmount: DecimalLike;
  sellQty: number;
  sellAmount: DecimalLike;
  averagePrice: DecimalLike;
  realizedPnL: DecimalLike;
  blockedMargin: DecimalLike;
  createdAt: Date;
  updatedAt: Date;
}
