import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { BaseRepository } from "../BaseRepository";
import {
  IWalletTransactionRepository,
  WalletStatementQueryOptions,
} from "../../../domain/repositories/wallet/IWalletTransactionRepository";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { WalletTransactionPersistenceDTO } from "../../../application/dto/internal/WalletTransactionPersistenceDTO";
import { WalletTransactionPersistenceMapper } from "../../../application/mapper/wallet/WalletTransactionPersistenceMapper";
import { PaginatedResult } from "../../../domain/repositories/user/IUserRepository";
import { handlePrismaError } from "../../database/handlePrismaError";

export class WalletTransactionRepository
  extends BaseRepository<WalletTransactionPersistenceDTO, Prisma.WalletTransactionDelegate>
  implements IWalletTransactionRepository
{
  constructor() {
    super(prisma.walletTransaction);
  }

  async findById(id: string): Promise<WalletTransaction | null> {
    const raw = await this._findById(id);
    if (!raw) return null;
    return WalletTransactionPersistenceMapper.toDomain(raw);
  }

  async findByReferenceId(referenceId: string): Promise<WalletTransaction | null> {
    try {
      const raw = await prisma.walletTransaction.findUnique({
        where: { referenceId },
      });
      if (!raw) return null;
      return WalletTransactionPersistenceMapper.toDomain(raw as any);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findStatement(
    options: WalletStatementQueryOptions
  ): Promise<PaginatedResult<WalletTransaction>> {
    try {
      const { userId, page, limit, search, type, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const where: Prisma.WalletTransactionWhereInput = {
        userId,
      };

      if (type && type !== "ALL") {
        where.type = type;
      }

      if (search && search.trim() !== "") {
        where.OR = [
          { referenceId: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const [rawRecords, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      const data = rawRecords.map((record) =>
        WalletTransactionPersistenceMapper.toDomain(record as any)
      );
      return { data, total };
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
