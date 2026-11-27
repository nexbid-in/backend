import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  IStockRepository,
  StockSearchOptions,
  StockSearchResult,
} from "../../../domain/repositories/stock/IStockRepository";
import { Stock } from "../../../domain/entities/Stock";
import { StockPersistenceDTO } from "../../../application/dto/internal/StockPersistenceDTO";
import { StockPersistenceMapper } from "../../../application/mapper/stock/StockPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";
import { DEFAULT_PRIORITY_BENCHMARKS } from "../../config/stockSearchConfig";

export class StockRepository
  extends BaseRepository<StockPersistenceDTO, Prisma.StockDelegate>
  implements IStockRepository
{
  constructor(
    private readonly priorityBenchmarks: readonly string[] = DEFAULT_PRIORITY_BENCHMARKS
  ) {
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

  async findByFeedSymbol(feedSymbol: string): Promise<Stock | null> {
    try {
      const raw = await prisma.stock.findUnique({
        where: { feedSymbol: feedSymbol.toUpperCase().trim() },
      });
      if (!raw) return null;
      return StockPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<Stock[]> {
    try {
      const raw = await prisma.stock.findMany({
        orderBy: { symbol: "asc" },
      });
      return raw.map((r) => StockPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async search(options: StockSearchOptions): Promise<StockSearchResult> {
    try {
      const trimmed = options.query?.trim() ?? "";
      const type = options.type ?? "ALL";
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 50) : 20;

      const baseWhere: Prisma.StockWhereInput = {
        isActive: true,
        ...(trimmed
          ? {
              OR: [
                { symbol: { contains: trimmed, mode: "insensitive" } },
                { name: { contains: trimmed, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const rawStocks = await prisma.stock.findMany({
        where: baseWhere,
      });

      let filtered = rawStocks.map((raw) => StockPersistenceMapper.toDomain(raw));

      if (type === "EQUITY") {
        filtered = filtered.filter((s) => s.type === "EQUITY");
      } else if (type === "INDEX") {
        filtered = filtered.filter((s) => s.type === "INDEX");
      }

      if (trimmed) {
        const qUpper = trimmed.toUpperCase();
        filtered.sort((a, b) => {
          const rankA = this.getRelevanceScore(a, qUpper);
          const rankB = this.getRelevanceScore(b, qUpper);
          if (rankA !== rankB) return rankA - rankB;
          return a.symbol.localeCompare(b.symbol);
        });
      } else {
        filtered.sort((a, b) => {
          const rankA = this.getBrowseScore(a, this.priorityBenchmarks);
          const rankB = this.getBrowseScore(b, this.priorityBenchmarks);
          if (rankA !== rankB) return rankA - rankB;
          return a.symbol.localeCompare(b.symbol);
        });
      }

      const total = filtered.length;
      const skip = (page - 1) * limit;
      const paginatedStocks = filtered.slice(skip, skip + limit);

      return {
        stocks: paginatedStocks,
        total,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  private getRelevanceScore(stock: Stock, qUpper: string): number {
    const sym = stock.symbol.toUpperCase();
    const name = stock.name.toUpperCase();

    if (sym === qUpper) return 1;
    if (sym.startsWith(qUpper)) return 2;
    if (sym.includes(qUpper)) return 3;
    if (name.startsWith(qUpper)) return 4;
    return 5;
  }

  private getBrowseScore(stock: Stock, priorityBenchmarks: readonly string[]): number {
    if (stock.type === "INDEX") {
      const idx = priorityBenchmarks.indexOf(stock.symbol);
      return idx !== -1 ? idx : 50;
    }
    return 100;
  }

  async save(stock: Stock): Promise<Stock> {
    try {
      const data = StockPersistenceMapper.toPrisma(stock);
      const raw = await prisma.stock.create({
        data: {
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          exchange: data.exchange,
          sector: data.sector,
          type: data.type,
          feedSymbol: data.feedSymbol,
          isActive: data.isActive,
          isTradable: data.isTradable,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
      return StockPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(stock: Stock): Promise<Stock> {
    try {
      const data = StockPersistenceMapper.toPrisma(stock);
      const raw = await prisma.stock.update({
        where: { id: data.id },
        data: {
          name: data.name,
          exchange: data.exchange,
          sector: data.sector,
          type: data.type,
          feedSymbol: data.feedSymbol,
          isActive: data.isActive,
          isTradable: data.isTradable,
          updatedAt: new Date(),
        },
      });
      return StockPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.stock.delete({ where: { id } });
      return true;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async countOrdersByStockId(stockId: string): Promise<number> {
    try {
      const count = await prisma.order.count({ where: { stockId } });
      return count;
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
