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

  async search(options: StockSearchOptions): Promise<StockSearchResult> {
    try {
      const trimmed = options.query?.trim() ?? "";
      const type = options.type ?? "ALL";
      const page = options.page && options.page > 0 ? options.page : 1;
      const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 50) : 20;

      // Base query for active instruments matching optional text query
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

      // 1. Fetch all active matching records to calculate counts and sort by relevance
      const rawStocks = await prisma.stock.findMany({
        where: baseWhere,
      });

      const allMatchingStocks = rawStocks.map((raw) => StockPersistenceMapper.toDomain(raw));

      // 2. Compute tab badge counts
      const equitiesCount = allMatchingStocks.filter((s) => s.type === "EQUITY").length;
      const indicesCount = allMatchingStocks.filter((s) => s.type === "INDEX").length;
      const counts = {
        all: allMatchingStocks.length,
        equities: equitiesCount,
        indices: indicesCount,
      };

      // 3. Filter by instrument type if not 'ALL'
      let filtered = allMatchingStocks;
      if (type === "EQUITY") {
        filtered = allMatchingStocks.filter((s) => s.type === "EQUITY");
      } else if (type === "INDEX") {
        filtered = allMatchingStocks.filter((s) => s.type === "INDEX");
      }

      // 4. Sorting & Relevance Ranking
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
        // Query is provided: sort by relevance (exact symbol -> prefix symbol -> contains symbol -> prefix name -> contains name)
        const qUpper = trimmed.toUpperCase();
        filtered.sort((a, b) => {
          const rankA = this.getRelevanceScore(a, qUpper);
          const rankB = this.getRelevanceScore(b, qUpper);
          if (rankA !== rankB) return rankA - rankB;
          return a.symbol.localeCompare(b.symbol);
        });
      } else {
        // Query is empty: key indices first, then equities sorted alphabetically
        filtered.sort((a, b) => {
          const rankA = this.getBrowseScore(a, PRIORITY_BENCHMARKS);
          const rankB = this.getBrowseScore(b, PRIORITY_BENCHMARKS);
          if (rankA !== rankB) return rankA - rankB;
          return a.symbol.localeCompare(b.symbol);
        });
      }

      // 5. Apply pagination
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

    // 1. Exact symbol match
    if (sym === qUpper) return 1;
    // 2. Symbol prefix match
    if (sym.startsWith(qUpper)) return 2;
    // 3. Symbol contains match
    if (sym.includes(qUpper)) return 3;
    // 4. Name prefix match
    if (name.startsWith(qUpper)) return 4;
    // 5. Name contains match
    return 5;
  }

  private getBrowseScore(stock: Stock, priorityBenchmarks: string[]): number {
    if (stock.type === "INDEX") {
      const idx = priorityBenchmarks.indexOf(stock.symbol);
      return idx !== -1 ? idx : 50;
    }
    // Equities appear after indices
    return 100;
  }
}
