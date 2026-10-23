import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { Wallet } from "../../../domain/entities/Wallet";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { WalletPersistenceMapper } from "../../../application/mapper/wallet/WalletPersistenceMapper";
import { WalletTransactionPersistenceMapper } from "../../../application/mapper/wallet/WalletTransactionPersistenceMapper";
import { handlePrismaError } from "../../database/handlePrismaError";

export class WalletRepository implements IWalletRepository {
  async findById(id: string): Promise<Wallet | null> {
    try {
      const raw = await prisma.wallet.findUnique({
        where: { id },
      });
      if (!raw) return null;
      return WalletPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    try {
      const raw = await prisma.wallet.findUnique({
        where: { userId },
      });
      if (!raw) return null;
      return WalletPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findOrCreateByUserId(userId: string): Promise<Wallet> {
    try {
      const raw = await prisma.wallet.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          balance: 0,
          usedMargin: 0,
          totalVirtualBought: 0,
          totalRealSpent: 0,
          status: "ACTIVE",
        },
      });
      return WalletPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async saveWithTransaction(
    wallet: Wallet,
    transaction: WalletTransaction
  ): Promise<void> {
    try {
      const walletData = WalletPersistenceMapper.toPrisma(wallet);
      const txData = WalletTransactionPersistenceMapper.toPrisma(transaction);

      await prisma.$transaction(async (tx) => {
        // 1. Update wallet state
        await tx.wallet.update({
          where: { id: walletData.id },
          data: {
            balance: Number(walletData.balance),
            usedMargin: Number(walletData.usedMargin),
            totalVirtualBought: Number(walletData.totalVirtualBought),
            totalRealSpent: Number(walletData.totalRealSpent),
            status: walletData.status,
            updatedAt: walletData.updatedAt,
          },
        });

        // 2. Insert ledger transaction
        await tx.walletTransaction.create({
          data: {
            id: txData.id,
            walletId: txData.walletId,
            userId: txData.userId,
            referenceId: txData.referenceId,
            type: txData.type,
            amount: Number(txData.amount),
            balanceAfter: Number(txData.balanceAfter),
            description: txData.description,
            metadata: (txData.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            createdAt: txData.createdAt,
          },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
