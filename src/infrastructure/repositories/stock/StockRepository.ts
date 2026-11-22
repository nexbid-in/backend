import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  IStockRepository,
  StockSearchOptions,
  StockSearchResult,
  AdminStockFilters,
  AdminStockMetrics,
} from "../../../domain/repositories/stock/IStockRepository";
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

      const allMatchingStocks = rawStocks.map((raw) => StockPersistenceMapper.toDomain(raw));

      const equitiesCount = allMatchingStocks.filter((s) => s.type === "EQUITY").length;
      const indicesCount = allMatchingStocks.filter((s) => s.type === "INDEX").length;
      const counts = {
        all: allMatchingStocks.length,
        equities: equitiesCount,
        indices: indicesCount,
      };

      let filtered = allMatchingStocks;
      if (type === "EQUITY") {
        filtered = allMatchingStocks.filter((s) => s.type === "EQUITY");
      } else if (type === "INDEX") {
        filtered = allMatchingStocks.filter((s) => s.type === "INDEX");
      }

      const PRIORITY_BENCHMARKS = [
        "NIFTY 50",
        "SENSEX",
        "BSE SENSEX",
        "BANKNIFTY",
        "NIFTY BANK",
        "NIFTY IT",
        "NIFTY AUTO",
        "NIFTY PHARMA",
        "NIFTY METAL",
        "NIFTY FMCG",
        "NIFTY MIDCAP 50",
      ];

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
          const rankA = this.getBrowseScore(a, PRIORITY_BENCHMARKS);
          const rankB = this.getBrowseScore(b, PRIORITY_BENCHMARKS);
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
        counts,
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

  private getBrowseScore(stock: Stock, priorityBenchmarks: string[]): number {
    if (stock.type === "INDEX") {
      const idx = priorityBenchmarks.indexOf(stock.symbol);
      return idx !== -1 ? idx : 50;
    }
    return 100;
  }

  async findAdminStocks(filters: AdminStockFilters): Promise<{
    stocks: Stock[];
    total: number;
    metrics: AdminStockMetrics;
    orderCounts: Record<string, number>;
  }> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
      const skip = (page - 1) * limit;

      const where: Prisma.StockWhereInput = {};

      if (filters.query?.trim()) {
        const q = filters.query.trim();
        where.OR = [
          { symbol: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { feedSymbol: { contains: q, mode: "insensitive" } },
        ];
      }

      if (filters.type && filters.type !== "ALL") {
        where.type = filters.type;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.isTradable !== undefined) {
        where.isTradable = filters.isTradable;
      }

      if (filters.sector?.trim()) {
        where.sector = { equals: filters.sector.trim(), mode: "insensitive" };
      }

      const [rawStocks, total, totalStocks, activeStocks, tradableStocks, distinctSectors] =
        await Promise.all([
          prisma.stock.findMany({
            where,
            orderBy: [{ type: "asc" }, { symbol: "asc" }],
            skip,
            take: limit,
          }),
          prisma.stock.count({ where }),
          prisma.stock.count(),
          prisma.stock.count({ where: { isActive: true } }),
          prisma.stock.count({ where: { isTradable: true } }),
          prisma.stock.findMany({
            where: { sector: { not: null } },
            select: { sector: true },
            distinct: ["sector"],
          }),
        ]);

      const stockIds = rawStocks.map((s) => s.id);
      const orderCountsRaw = await prisma.order.groupBy({
        by: ["stockId"],
        where: { stockId: { in: stockIds } },
        _count: { id: true },
      });

      const orderCounts: Record<string, number> = {};
      for (const item of orderCountsRaw) {
        orderCounts[item.stockId] = item._count.id;
      }

      return {
        stocks: rawStocks.map((r) => StockPersistenceMapper.toDomain(r)),
        total,
        metrics: {
          totalStocks,
          activeStocks,
          tradableStocks,
          totalSectors: distinctSectors.length,
        },
        orderCounts,
      };
    } catch (error) {
      handlePrismaError(error);
    }
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
