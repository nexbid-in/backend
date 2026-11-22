import crypto from "crypto";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { Wallet } from "../../../domain/entities/Wallet";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { PaymentOrder } from "../../../domain/entities/PaymentOrder";

export interface SettleTopupSuccessParams {
  wallet: Wallet;
  paymentOrder: PaymentOrder;
  paymentId: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
}

export class WalletTopupSettlementService {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async settleTopupSuccess(params: SettleTopupSuccessParams): Promise<void> {
    const { wallet, paymentOrder, paymentId, description, metadata } = params;

    paymentOrder.markAsSuccess(paymentId);
    wallet.topUp(paymentOrder.virtualAmount, paymentOrder.realAmount);

    const transaction = WalletTransaction.create({
      id: crypto.randomUUID(),
      walletId: wallet.id,
      userId: wallet.userId,
      referenceId: paymentOrder.id,
      type: "TOPUP",
      amount: paymentOrder.virtualAmount,
      balanceAfter: wallet.balance,
      description: description ?? `Virtual money top-up (₹${paymentOrder.realAmount})`,
      metadata: metadata ?? null,
    });

    await this.walletRepo.saveTopupWithTransaction(wallet, transaction, paymentOrder);
  }
}
