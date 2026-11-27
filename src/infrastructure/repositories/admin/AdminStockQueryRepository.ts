import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { handlePrismaError } from "../../database/handlePrismaError";
import {
  AdminStockFilters,
  AdminStockQueryResult,
  IAdminStockQueryRepository,
} from "../../../application/interface/repositories/admin/IAdminStockQueryRepository";
import { StockPersistenceMapper } from "../../../application/mapper/stock/StockPersistenceMapper";

/**
 * Read-only Prisma query repository for admin stock listings, counts, and order aggregations.
 */
export class AdminStockQueryRepository implements IAdminStockQueryRepository {
  async findAdminStocks(
    filters: AdminStockFilters
  ): Promise<AdminStockQueryResult> {
    try {
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
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

      const [rawStocks, total, totalStocks, activeStocks, tradableStocks] =
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
        },
        orderCounts,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
