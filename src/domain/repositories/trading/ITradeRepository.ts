import { Trade } from "../../entities/trading/Trade";
import { OrderSide, ProductType } from "../../entities/trading/Order";

export interface TradeFilterOptions {
  from?: Date;
  to?: Date;
  symbol?: string;
  productType?: ProductType;
  side?: OrderSide;
  skip?: number;
  take?: number;
  orderBy?: "asc" | "desc";
}

export interface ITradeRepository {
  save(trade: Trade): Promise<Trade>;
  findByUserId(userId: string, options?: TradeFilterOptions): Promise<Trade[]>;
  countByUserId(userId: string, options?: TradeFilterOptions): Promise<number>;
}
