import { Trade } from "../../entities/trading/Trade";
import { ProductType } from "../../entities/trading/Order";

export interface TradeFilterOptions {
  from?: Date;
  to?: Date;
  symbol?: string;
  productType?: ProductType;
}

export interface ITradeRepository {
  save(trade: Trade): Promise<Trade>;
  findByUserId(userId: string, options?: TradeFilterOptions): Promise<Trade[]>;
}

