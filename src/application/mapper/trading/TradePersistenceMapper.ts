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
      price: Money.of(raw.price as any),
      tradeValue: Money.of(raw.tradeValue as any),
      realizedPnL: Money.of(raw.realizedPnL as any),
      charges: {
        brokerage: Money.of((raw.brokerage as any) ?? 0),
        stt: Money.of((raw.stt as any) ?? 0),
        exchangeTurnoverCharges: Money.of((raw.exchangeTurnoverCharges as any) ?? 0),
        sebiCharges: Money.of((raw.sebiCharges as any) ?? 0),
        stampDuty: Money.of((raw.stampDuty as any) ?? 0),
        gst: Money.of((raw.gst as any) ?? 0),
        totalCharges: Money.of((raw.totalCharges as any) ?? 0),
      },
      executedAt: raw.executedAt,
    });
  }
}
