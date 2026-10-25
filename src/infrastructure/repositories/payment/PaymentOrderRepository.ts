import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  IPaymentOrderRepository,
  PaymentOrderQueryOptions,
} from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { PaymentOrder } from "../../../domain/entities/PaymentOrder";
import { PaymentOrderPersistenceDTO } from "../../../application/dto/internal/PaymentOrderPersistenceDTO";
import { PaymentOrderPersistenceMapper } from "../../../application/mapper/payment/PaymentOrderPersistenceMapper";
import { PaginatedResult } from "../../../domain/repositories/user/IUserRepository";
import { handlePrismaError } from "../../database/handlePrismaError";

export class PaymentOrderRepository
  extends BaseRepository<PaymentOrderPersistenceDTO, Prisma.PaymentOrderDelegate>
  implements IPaymentOrderRepository
{
  constructor() {
    super(prisma.paymentOrder);
  }

  async findById(id: string): Promise<PaymentOrder | null> {
    const raw = await this._findById(id);
    if (!raw) return null;
    return PaymentOrderPersistenceMapper.toDomain(raw);
  }

  async findByOrderId(orderId: string): Promise<PaymentOrder | null> {
    try {
      const raw = await prisma.paymentOrder.findUnique({
        where: { orderId },
      });
      if (!raw) return null;
      return PaymentOrderPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async save(order: PaymentOrder): Promise<void> {
    try {
      const data = PaymentOrderPersistenceMapper.toPrisma(order);
      const exists = await this.existsById(data.id);

      if (exists) {
        await this._update(data.id, {
          paymentId: data.paymentId,
          status: data.status,
          updatedAt: data.updatedAt,
        });
      } else {
        await this._create({
          id: data.id,
          userId: data.userId,
          orderId: data.orderId,
          paymentId: data.paymentId,
          realAmount: Number(data.realAmount),
          virtualAmount: Number(data.virtualAmount),
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findHistory(
    options: PaymentOrderQueryOptions
  ): Promise<PaginatedResult<PaymentOrder>> {
    try {
      const { userId, page, limit, status, search, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.PaymentOrderWhereInput = {
        userId,
      };

      if (status && status !== "ALL") {
        where.status = status;
      }

      if (search && search.trim() !== "") {
        where.OR = [
          { id: { contains: search, mode: "insensitive" } },
          { orderId: { contains: search, mode: "insensitive" } },
          { paymentId: { contains: search, mode: "insensitive" } },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [rawRecords, total] = await Promise.all([
        prisma.paymentOrder.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.paymentOrder.count({ where }),
      ]);

      const data = rawRecords.map((record) =>
        PaymentOrderPersistenceMapper.toDomain(record)
      );

      return { data, total };
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

