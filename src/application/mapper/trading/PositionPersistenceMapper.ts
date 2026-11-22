import { Position } from "../../../domain/entities/trading/Position";
import { PositionPersistenceDTO, DecimalLike } from "../../dto/internal/PositionPersistenceDTO";

function toNum(val: DecimalLike | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class PositionPersistenceMapper {
  static toPrisma(position: Position): PositionPersistenceDTO {
    return {
      id: position.id,
      userId: position.userId,
      stockId: position.stockId,
      symbol: position.symbol,
      productType: position.productType,
      side: position.side,
      quantity: position.quantity,
      buyQty: position.buyQty,
      buyAmount: position.buyAmount,
      sellQty: position.sellQty,
      sellAmount: position.sellAmount,
      averagePrice: position.averagePrice,
      realizedPnL: position.realizedPnL,
      blockedMargin: position.blockedMargin,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }

  static toDomain(raw: PositionPersistenceDTO): Position {
    return Position.create({
      id: raw.id,
      userId: raw.userId,
      stockId: raw.stockId,
      symbol: raw.symbol,
      productType: raw.productType,
      side: raw.side,
      quantity: raw.quantity,
      buyQty: raw.buyQty,
      buyAmount: toNum(raw.buyAmount),
      sellQty: raw.sellQty,
      sellAmount: toNum(raw.sellAmount),
      averagePrice: toNum(raw.averagePrice),
      realizedPnL: toNum(raw.realizedPnL),
      blockedMargin: toNum(raw.blockedMargin),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}

