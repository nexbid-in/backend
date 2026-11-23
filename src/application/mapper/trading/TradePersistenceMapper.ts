import { Trade } from "../../../domain/entities/trading/Trade";
import { TradePersistenceDTO } from "../../dto/internal/TradePersistenceDTO";
import { Money } from "../../../domain/value-objects/Money";

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
      price: trade.price.toDecimal(),
      tradeValue: trade.tradeValue.toDecimal(),
      realizedPnL: trade.realizedPnL.toDecimal(),
      brokerage: trade.brokerage.toDecimal(),
      stt: trade.stt.toDecimal(),
      exchangeTurnoverCharges: trade.exchangeTurnoverCharges.toDecimal(),
      sebiCharges: trade.sebiCharges.toDecimal(),
      stampDuty: trade.stampDuty.toDecimal(),
      gst: trade.gst.toDecimal(),
      totalCharges: trade.totalCharges.toDecimal(),
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
      price: Money.of(String(raw.price)),
      tradeValue: Money.of(String(raw.tradeValue)),
      realizedPnL: Money.of(String(raw.realizedPnL)),
      charges: {
        brokerage: Money.of(String(raw.brokerage ?? 0)),
        stt: Money.of(String(raw.stt ?? 0)),
        exchangeTurnoverCharges: Money.of(String(raw.exchangeTurnoverCharges ?? 0)),
        sebiCharges: Money.of(String(raw.sebiCharges ?? 0)),
        stampDuty: Money.of(String(raw.stampDuty ?? 0)),
        gst: Money.of(String(raw.gst ?? 0)),
        totalCharges: Money.of(String(raw.totalCharges ?? 0)),
      },
      executedAt: raw.executedAt,
    });
  }
}
