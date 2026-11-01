import { prisma } from "../../database/prisma";
import { IWatchlistRepository } from "../../../domain/repositories/watchlist/IWatchlistRepository";
import { WatchlistItem } from "../../../domain/entities/WatchlistItem";
import { WatchlistPersistenceMapper } from "../../../application/mapper/watchlist/WatchlistPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class WatchlistRepository implements IWatchlistRepository {
  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    try {
      const rawItems = await prisma.watchlistItem.findMany({
        where: { userId },
        include: { stock: true },
        orderBy: { order: "asc" },
      });

      return rawItems.map((item) => WatchlistPersistenceMapper.toDomain(item));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUserAndStockId(userId: string, stockId: string): Promise<WatchlistItem | null> {
    try {
      const raw = await prisma.watchlistItem.findUnique({
        where: {
          userId_stockId: {
            userId,
            stockId,
          },
        },
        include: { stock: true },
      });

      if (!raw) return null;
      return WatchlistPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async save(item: WatchlistItem): Promise<void> {
    try {
      const data = WatchlistPersistenceMapper.toPrisma(item);

      await prisma.watchlistItem.upsert({
        where: {
          userId_stockId: {
            userId: data.userId,
            stockId: data.stockId,
          },
        },
        update: {
          order: data.order,
        },
        create: {
          id: data.id,
          userId: data.userId,
          stockId: data.stockId,
          order: data.order,
          createdAt: data.createdAt,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(userId: string, stockId: string): Promise<void> {
    try {
      await prisma.watchlistItem.delete({
        where: {
          userId_stockId: {
            userId,
            stockId,
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.watchlistItem.count({
        where: { userId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
