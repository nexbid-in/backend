import crypto from "crypto";
import { IVerifyTopupPaymentUseCase } from "../../interface/use-cases/wallet/IVerifyTopupPaymentUseCase";
import {
  VerifyTopupPaymentRequestDTO,
  VerifyTopupPaymentResponseDTO,
} from "../../dto/wallet/VerifyTopupPaymentDTO";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { IPaymentGatewayService } from "../../interface/services/IPaymentGatewayService";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class VerifyTopupPaymentUseCase implements IVerifyTopupPaymentUseCase {
  constructor(
    private readonly _walletRepo: IWalletRepository,
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _paymentGateway: IPaymentGatewayService
  ) {}

  async execute(data: VerifyTopupPaymentRequestDTO): Promise<VerifyTopupPaymentResponseDTO> {
    const paymentOrder = await this._paymentOrderRepo.findByOrderId(data.orderId);
    if (!paymentOrder) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
    }

    if (paymentOrder.userId !== data.userId) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    const wallet = await this._walletRepo.findByUserId(data.userId);
    if (!wallet) {
      throw new AppError(ErrorCodes.WALLET_NOT_FOUND);
    }

    // Idempotency: if already processed, return current wallet state without re-crediting
    if (paymentOrder.status === "SUCCESS") {
      return {
        success: true,
        balance: wallet.balance,
        virtualAmountAdded: 0,
      };
    }

    const isValid = this._paymentGateway.verifySignature(
      data.orderId,
      data.paymentId,
      data.signature
    );

    if (!isValid) {
      paymentOrder.markAsFailed();
      await this._paymentOrderRepo.save(paymentOrder);
      throw new AppError(ErrorCodes.PAYMENT_VERIFICATION_FAILED);
    }

    paymentOrder.markAsSuccess(data.paymentId);
    wallet.topUp(paymentOrder.virtualAmount, paymentOrder.realAmount);

    const transaction = WalletTransaction.create({
      id: crypto.randomUUID(),
      walletId: wallet.id,
      userId: wallet.userId,
      referenceId: paymentOrder.id,
      type: "TOPUP",
      amount: paymentOrder.virtualAmount,
      balanceAfter: wallet.balance,
      description: `Virtual money top-up (₹${paymentOrder.realAmount})`,
      metadata: {
        orderId: data.orderId,
        paymentId: data.paymentId,
      },
    });

    await this._walletRepo.saveTopupWithTransaction(wallet, transaction, paymentOrder);

    return {
      success: true,
      balance: wallet.balance,
      virtualAmountAdded: paymentOrder.virtualAmount,
    };
  }
}
