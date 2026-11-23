import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  ITradeRepository,
  TradeFilterOptions,
} from "../../../domain/repositories/trading/ITradeRepository";
import { Trade } from "../../../domain/entities/trading/Trade";
import { TradePersistenceDTO } from "../../../application/dto/internal/TradePersistenceDTO";
import { TradePersistenceMapper } from "../../../application/mapper/trading/TradePersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class TradeRepository
  extends BaseRepository<TradePersistenceDTO, Prisma.TradeDelegate>
  implements ITradeRepository
{
  constructor() {
    super(prisma.trade);
  }

  async save(trade: Trade): Promise<Trade> {
    try {
      const data = TradePersistenceMapper.toPrisma(trade);
      const raw = await prisma.trade.create({
        data: {
          id: data.id,
          orderId: data.orderId,
          userId: data.userId,
          stockId: data.stockId,
          symbol: data.symbol,
          side: data.side,
          productType: data.productType,
          quantity: data.quantity,
          price: data.price,
          tradeValue: data.tradeValue,
          realizedPnL: data.realizedPnL,
          brokerage: data.brokerage ?? 0,
          stt: data.stt ?? 0,
          exchangeTurnoverCharges: data.exchangeTurnoverCharges ?? 0,
          sebiCharges: data.sebiCharges ?? 0,
          stampDuty: data.stampDuty ?? 0,
          gst: data.gst ?? 0,
          totalCharges: data.totalCharges ?? 0,
          executedAt: data.executedAt,
        },
      });
      return TradePersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUserId(userId: string, options?: TradeFilterOptions): Promise<Trade[]> {
    try {
      const executedAtFilter: Prisma.DateTimeFilter | undefined =
        options?.from || options?.to
          ? {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            }
          : undefined;

      const raw = await prisma.trade.findMany({
        where: {
          userId,
          ...(options?.symbol ? { symbol: options.symbol.toUpperCase().trim() } : {}),
          ...(options?.productType ? { productType: options.productType } : {}),
          ...(executedAtFilter ? { executedAt: executedAtFilter } : {}),
        },
        orderBy: { executedAt: "desc" },
      });
      return raw.map((r) => TradePersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
