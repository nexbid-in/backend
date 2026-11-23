import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Prisma } from "../../../infrastructure/database/generated/prisma/client";

export type DecimalLike = Prisma.Decimal | number | string;

export interface TradePersistenceDTO {
  id: string;
  orderId: string;
  userId: string;
  stockId: string;
  symbol: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: DecimalLike;
  tradeValue: DecimalLike;
  realizedPnL: DecimalLike;
  brokerage?: DecimalLike;
  stt?: DecimalLike;
  exchangeTurnoverCharges?: DecimalLike;
  sebiCharges?: DecimalLike;
  stampDuty?: DecimalLike;
  gst?: DecimalLike;
  totalCharges?: DecimalLike;
  executedAt: Date;
}
