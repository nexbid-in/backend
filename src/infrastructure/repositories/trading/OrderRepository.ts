import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  AdminOrderDetailsWithRelations,
  AdminOrderFilterOptions,
  AdminOrderMetrics,
  AdminOrderWithRelations,
  IOrderRepository,
  PaginatedAdminOrdersResult,
} from "../../../domain/repositories/trading/IOrderRepository";
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
  ProductType,
} from "../../../domain/entities/trading/Order";
import { OrderPersistenceDTO } from "../../../application/dto/internal/OrderPersistenceDTO";
import { OrderPersistenceMapper } from "../../../application/mapper/trading/OrderPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class OrderRepository
  extends BaseRepository<OrderPersistenceDTO, Prisma.OrderDelegate>
  implements IOrderRepository
{
  constructor() {
    super(prisma.order);
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const raw = await prisma.order.findUnique({ where: { id } });
      if (!raw) return null;
      return OrderPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async save(order: Order): Promise<Order> {
    try {
      const data = OrderPersistenceMapper.toPrisma(order);
      const raw = await prisma.order.create({
        data: {
          id: data.id,
          userId: data.userId,
          stockId: data.stockId,
          symbol: data.symbol,
          side: data.side,
          orderType: data.orderType,
          productType: data.productType,
          status: data.status,
          quantity: data.quantity,
          filledQuantity: data.filledQuantity,
          price: data.price,
          averagePrice: data.averagePrice,
          triggerPrice: data.triggerPrice,
          rejectionReason: data.rejectionReason,
          blockedMargin: data.blockedMargin,
          isAmo: data.isAmo ?? false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      });
      return OrderPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(order: Order): Promise<Order> {
    try {
      const data = OrderPersistenceMapper.toPrisma(order);
      const raw = await prisma.order.update({
        where: { id: data.id },
        data: {
          status: data.status,
          filledQuantity: data.filledQuantity,
          averagePrice: data.averagePrice,
          rejectionReason: data.rejectionReason,
          blockedMargin: data.blockedMargin,
          updatedAt: data.updatedAt,
        },
      });
      return OrderPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findPendingOrders(): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: { status: OrderStatus.PENDING },
        orderBy: { createdAt: "asc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findPendingAmoOrders(): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          isAmo: true,
        },
        orderBy: { createdAt: "asc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findPendingDayOrders(beforeDate?: Date): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          isAmo: false,
          ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
        },
        orderBy: { createdAt: "asc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUserId(
    userId: string,
    status?: OrderStatus,
    sessionStart?: Date
  ): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: {
          userId,
          ...(status ? { status } : {}),
          ...(sessionStart
            ? {
                OR: [
                  { createdAt: { gte: sessionStart } },
                  { isAmo: true, status: OrderStatus.PENDING },
                  { isAmo: true, updatedAt: { gte: sessionStart } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findManyWithFilters(
    options: AdminOrderFilterOptions
  ): Promise<PaginatedAdminOrdersResult> {
    try {
      const {
        page,
        limit,
        search,
        status,
        side,
        productType,
        isAmo,
        startDate,
        endDate,
      } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {};

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (side && side !== "ALL") {
        where.side = side;
      }

      if (productType && productType !== "ALL") {
        where.productType = productType;
      }

      if (isAmo !== undefined) {
        where.isAmo = isAmo;
      }

      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        };
      }

      if (search && search.trim() !== "") {
        const trimmed = search.trim();
        where.OR = [
          { id: { contains: trimmed, mode: "insensitive" } },
          { symbol: { contains: trimmed, mode: "insensitive" } },
          { user: { firstName: { contains: trimmed, mode: "insensitive" } } },
          { user: { lastName: { contains: trimmed, mode: "insensitive" } } },
          { user: { email: { contains: trimmed, mode: "insensitive" } } },
          { user: { id: { contains: trimmed, mode: "insensitive" } } },
        ];
      }

      const [rawOrders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
              },
            },
            stock: {
              select: {
                symbol: true,
                name: true,
                exchange: true,
              },
            },
          },
        }),
        prisma.order.count({ where }),
      ]);

      const data: AdminOrderWithRelations[] = rawOrders.map((raw) => ({
        id: raw.id,
        userId: raw.userId,
        user: {
          id: raw.user.id,
          firstName: raw.user.firstName,
          lastName: raw.user.lastName,
          email: raw.user.email,
          profileImage: raw.user.profileImage,
        },
        stockId: raw.stockId,
        symbol: raw.symbol,
        stock: {
          symbol: raw.stock.symbol,
          name: raw.stock.name,
          exchange: raw.stock.exchange,
        },
        side: raw.side as OrderSide,
        orderType: raw.orderType as OrderType,
        productType: raw.productType as ProductType,
        status: raw.status as OrderStatus,
        quantity: raw.quantity,
        filledQuantity: raw.filledQuantity,
        price: raw.price ? Number(raw.price) : null,
        averagePrice: raw.averagePrice ? Number(raw.averagePrice) : null,
        triggerPrice: raw.triggerPrice ? Number(raw.triggerPrice) : null,
        rejectionReason: raw.rejectionReason,
        blockedMargin: Number(raw.blockedMargin),
        isAmo: raw.isAmo,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      }));

      return { data, total };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAggregateMetrics(): Promise<AdminOrderMetrics> {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        todayOrdersCount,
        todayExecutedCount,
        todayRejectedCount,
        todayCancelledCount,
        pendingAmoCount,
        turnoverAgg,
      ] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.order.count({
          where: { createdAt: { gte: todayStart }, status: OrderStatus.EXECUTED },
        }),
        prisma.order.count({
          where: { createdAt: { gte: todayStart }, status: OrderStatus.REJECTED },
        }),
        prisma.order.count({
          where: { createdAt: { gte: todayStart }, status: OrderStatus.CANCELLED },
        }),
        prisma.order.count({
          where: { status: OrderStatus.PENDING, isAmo: true },
        }),
        prisma.trade.aggregate({
          where: { executedAt: { gte: todayStart } },
          _sum: { tradeValue: true },
        }),
      ]);

      return {
        todayOrdersCount,
        todayTurnover: turnoverAgg._sum.tradeValue
          ? Number(turnoverAgg._sum.tradeValue)
          : 0,
        pendingAmoCount,
        todayExecutedCount,
        todayRejectedCount,
        todayCancelledCount,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findDetailsById(
    id: string
  ): Promise<AdminOrderDetailsWithRelations | null> {
    try {
      const raw = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              profileImage: true,
              isBlocked: true,
              createdAt: true,
              wallet: {
                select: {
                  balance: true,
                  usedMargin: true,
                },
              },
            },
          },
          stock: {
            select: {
              id: true,
              symbol: true,
              name: true,
              exchange: true,
              sector: true,
              type: true,
            },
          },
          trades: {
            select: {
              id: true,
              side: true,
              productType: true,
              quantity: true,
              price: true,
              tradeValue: true,
              realizedPnL: true,
              executedAt: true,
            },
            orderBy: { executedAt: "desc" },
          },
        },
      });

      if (!raw) return null;

      return {
        id: raw.id,
        userId: raw.userId,
        user: {
          id: raw.user.id,
          firstName: raw.user.firstName,
          lastName: raw.user.lastName,
          email: raw.user.email,
          mobile: raw.user.mobile,
          profileImage: raw.user.profileImage,
          isBlocked: raw.user.isBlocked,
          createdAt: raw.user.createdAt,
          walletBalance: raw.user.wallet ? Number(raw.user.wallet.balance) : 0,
        },
        stockId: raw.stockId,
        symbol: raw.symbol,
        stock: {
          id: raw.stock.id,
          symbol: raw.stock.symbol,
          name: raw.stock.name,
          exchange: raw.stock.exchange,
          sector: raw.stock.sector,
          type: raw.stock.type,
        },
        side: raw.side as OrderSide,
        orderType: raw.orderType as OrderType,
        productType: raw.productType as ProductType,
        status: raw.status as OrderStatus,
        quantity: raw.quantity,
        filledQuantity: raw.filledQuantity,
        price: raw.price ? Number(raw.price) : null,
        averagePrice: raw.averagePrice ? Number(raw.averagePrice) : null,
        triggerPrice: raw.triggerPrice ? Number(raw.triggerPrice) : null,
        rejectionReason: raw.rejectionReason,
        blockedMargin: Number(raw.blockedMargin),
        isAmo: raw.isAmo,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        trades: raw.trades.map((t) => ({
          id: t.id,
          side: t.side as OrderSide,
          productType: t.productType as ProductType,
          quantity: t.quantity,
          price: Number(t.price),
          tradeValue: Number(t.tradeValue),
          realizedPnL: Number(t.realizedPnL),
          executedAt: t.executedAt,
        })),
      };
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
