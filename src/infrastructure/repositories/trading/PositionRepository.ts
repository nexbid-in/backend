import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { Position, PositionSide, ProductType } from "../../../domain/entities/trading/Position";
import { PositionPersistenceDTO } from "../../../application/dto/internal/PositionPersistenceDTO";
import { PositionPersistenceMapper } from "../../../application/mapper/trading/PositionPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class PositionRepository
  extends BaseRepository<PositionPersistenceDTO, Prisma.PositionDelegate>
  implements IPositionRepository
{
  constructor() {
    super(prisma.position);
  }

  async findById(id: string): Promise<Position | null> {
    try {
      const raw = await prisma.position.findUnique({ where: { id } });
      if (!raw) return null;
      return PositionPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUserAndSymbol(
    userId: string,
    symbol: string,
    productType: ProductType
  ): Promise<Position | null> {
    try {
      const raw = await prisma.position.findUnique({
        where: {
          userId_symbol_productType: {
            userId,
            symbol: symbol.toUpperCase().trim(),
            productType,
          },
        },
      });
      if (!raw) return null;
      return PositionPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOpenPositionsByUserId(userId: string): Promise<Position[]> {
    try {
      const raw = await prisma.position.findMany({
        where: {
          userId,
          side: { not: PositionSide.CLOSED },
          quantity: { gt: 0 },
        },
        orderBy: { updatedAt: "desc" },
      });
      return raw.map((r) => PositionPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAllPositionsByUserId(userId: string): Promise<Position[]> {
    try {
      const raw = await prisma.position.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      return raw.map((r) => PositionPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAllOpenMisPositions(): Promise<Position[]> {
    try {
      const raw = await prisma.position.findMany({
        where: {
          productType: ProductType.MIS,
          side: { not: PositionSide.CLOSED },
          quantity: { gt: 0 },
        },
      });
      return raw.map((r) => PositionPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async save(position: Position): Promise<Position> {
    try {
      const data = PositionPersistenceMapper.toPrisma(position);
      const raw = await prisma.position.create({
        data: {
          id: data.id,
          userId: data.userId,
          stockId: data.stockId,
          symbol: data.symbol,
          productType: data.productType,
          side: data.side,
          quantity: data.quantity,
          buyQty: data.buyQty,
          buyAmount: data.buyAmount,
          sellQty: data.sellQty,
          sellAmount: data.sellAmount,
          averagePrice: data.averagePrice,
          realizedPnL: data.realizedPnL,
          blockedMargin: data.blockedMargin,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
      return PositionPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(position: Position): Promise<Position> {
    try {
      const data = PositionPersistenceMapper.toPrisma(position);
      const raw = await prisma.position.update({
        where: { id: data.id },
        data: {
          side: data.side,
          quantity: data.quantity,
          buyQty: data.buyQty,
          buyAmount: data.buyAmount,
          sellQty: data.sellQty,
          sellAmount: data.sellAmount,
          averagePrice: data.averagePrice,
          realizedPnL: data.realizedPnL,
          blockedMargin: data.blockedMargin,
          updatedAt: data.updatedAt,
        },
      });
      return PositionPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

