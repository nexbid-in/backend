import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { Order, OrderStatus } from "../../../domain/entities/trading/Order";
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

  async findPendingOrdersBySymbol(symbol: string): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: {
          symbol: symbol.toUpperCase().trim(),
          status: OrderStatus.PENDING,
        },
        orderBy: { createdAt: "asc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
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

  async findByUserId(userId: string, status?: OrderStatus): Promise<Order[]> {
    try {
      const raw = await prisma.order.findMany({
        where: {
          userId,
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      return raw.map((r) => OrderPersistenceMapper.toDomain(r));
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

