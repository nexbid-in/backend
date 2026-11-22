import { Trade } from "../../../domain/entities/trading/Trade";
import { TradePersistenceDTO, DecimalLike } from "../../dto/internal/TradePersistenceDTO";

function toNum(val: DecimalLike | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class TradePersistenceMapper {
  static toPrisma(trade: Trade): TradePersistenceDTO {
    return {
      id: trade.id,
      orderId: trade.orderId,
      userId: trade.userId,
      stockId: trade.stockId,
      symbol: trade.symbol,
      side: trade.side,
      productType: trade.productType,
      quantity: trade.quantity,
      price: trade.price,
      tradeValue: trade.tradeValue,
      realizedPnL: trade.realizedPnL,
      executedAt: trade.executedAt,
    };
  }

  static toDomain(raw: TradePersistenceDTO): Trade {
    return Trade.create({
      id: raw.id,
      orderId: raw.orderId,
      userId: raw.userId,
      stockId: raw.stockId,
      symbol: raw.symbol,
      side: raw.side,
      productType: raw.productType,
      quantity: raw.quantity,
      price: toNum(raw.price),
      tradeValue: toNum(raw.tradeValue),
      realizedPnL: toNum(raw.realizedPnL),
      executedAt: raw.executedAt,
    });
  }
}

