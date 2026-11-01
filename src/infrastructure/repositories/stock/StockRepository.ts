import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { Stock } from "../../../domain/entities/Stock";
import { StockPersistenceDTO } from "../../../application/dto/internal/StockPersistenceDTO";
import { StockPersistenceMapper } from "../../../application/mapper/stock/StockPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class StockRepository
  extends BaseRepository<StockPersistenceDTO, Prisma.StockDelegate>
  implements IStockRepository
{
  constructor() {
    super(prisma.stock);
  }

  async findById(id: string): Promise<Stock | null> {
    try {
      const raw = await this._findById(id);
      if (!raw) return null;
      return StockPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findBySymbol(symbol: string): Promise<Stock | null> {
    try {
      const raw = await prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase().trim() },
      });
      if (!raw) return null;
      return StockPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async search(query: string, limit: number = 15): Promise<Stock[]> {
    try {
      const trimmed = query.trim();
      const rawStocks = await prisma.stock.findMany({
        where: {
          isActive: true,
          OR: [
            { symbol: { contains: trimmed, mode: "insensitive" } },
            { name: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { symbol: "asc" },
      });

      return rawStocks.map((raw) => StockPersistenceMapper.toDomain(raw));
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
