import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { DecimalLike } from "./WalletPersistenceDTO";

export type { DecimalLike };

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
