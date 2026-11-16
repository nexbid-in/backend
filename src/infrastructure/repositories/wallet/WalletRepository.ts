import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { Wallet } from "../../../domain/entities/Wallet";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { PaymentOrder } from "../../../domain/entities/PaymentOrder";
import { WalletPersistenceMapper } from "../../../application/mapper/wallet/WalletPersistenceMapper";
import { WalletTransactionPersistenceMapper } from "../../../application/mapper/wallet/WalletTransactionPersistenceMapper";
import { PaymentOrderPersistenceMapper } from "../../../application/mapper/payment/PaymentOrderPersistenceMapper";
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
          balance: "0.00",
          usedMargin: "0.00",
          totalVirtualBought: "0.00",
          totalRealSpent: "0.00",
          status: "ACTIVE",
        },
      });
      return WalletPersistenceMapper.toDomain(raw);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(wallet: Wallet): Promise<void> {
    try {
      const data = WalletPersistenceMapper.toPrisma(wallet);
      await prisma.wallet.update({
        where: { id: data.id },
        data: {
          balance: data.balance.toString(),
          usedMargin: data.usedMargin.toString(),
          totalVirtualBought: data.totalVirtualBought.toString(),
          totalRealSpent: data.totalRealSpent.toString(),
          status: data.status,
          updatedAt: data.updatedAt,
        },
      });
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
        await tx.wallet.update({
          where: { id: walletData.id },
          data: {
            balance: walletData.balance.toString(),
            usedMargin: walletData.usedMargin.toString(),
            totalVirtualBought: walletData.totalVirtualBought.toString(),
            totalRealSpent: walletData.totalRealSpent.toString(),
            status: walletData.status,
            updatedAt: walletData.updatedAt,
          },
        });

        await tx.walletTransaction.create({
          data: {
            id: txData.id,
            walletId: txData.walletId,
            userId: txData.userId,
            referenceId: txData.referenceId,
            type: txData.type,
            amount: txData.amount.toString(),
            balanceAfter: txData.balanceAfter.toString(),
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

  async saveTopupWithTransaction(
    wallet: Wallet,
    transaction: WalletTransaction,
    paymentOrder: PaymentOrder
  ): Promise<void> {
    try {
      const walletData = WalletPersistenceMapper.toPrisma(wallet);
      const txData = WalletTransactionPersistenceMapper.toPrisma(transaction);
      const orderData = PaymentOrderPersistenceMapper.toPrisma(paymentOrder);

      await prisma.$transaction(async (tx) => {
        await tx.paymentOrder.update({
          where: { id: orderData.id },
          data: {
            paymentId: orderData.paymentId,
            status: orderData.status,
            updatedAt: orderData.updatedAt,
          },
        });

        await tx.wallet.update({
          where: { id: walletData.id },
          data: {
            balance: walletData.balance.toString(),
            totalVirtualBought: walletData.totalVirtualBought.toString(),
            totalRealSpent: walletData.totalRealSpent.toString(),
            updatedAt: walletData.updatedAt,
          },
        });

        await tx.walletTransaction.create({
          data: {
            id: txData.id,
            walletId: txData.walletId,
            userId: txData.userId,
            referenceId: txData.referenceId,
            type: txData.type,
            amount: txData.amount.toString(),
            balanceAfter: txData.balanceAfter.toString(),
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
