import { IVerifyTopupPaymentUseCase } from "../../interface/use-cases/wallet/IVerifyTopupPaymentUseCase";
import {
  VerifyTopupPaymentRequestDTO,
  VerifyTopupPaymentResponseDTO,
} from "../../dto/wallet/VerifyTopupPaymentDTO";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { IPaymentGatewayService } from "../../interface/services/IPaymentGatewayService";
import { WalletTopupSettlementService } from "../../services/wallet/WalletTopupSettlementService";
import { PaymentStatus } from "../../../domain/entities/PaymentOrder";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class VerifyTopupPaymentUseCase implements IVerifyTopupPaymentUseCase {
  constructor(
    private readonly _walletRepo: IWalletRepository,
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _paymentGateway: IPaymentGatewayService,
    private readonly _settlementService: WalletTopupSettlementService
  ) {}

  async execute(data: VerifyTopupPaymentRequestDTO): Promise<VerifyTopupPaymentResponseDTO> {
    const paymentOrder = await this._paymentOrderRepo.findByOrderId(data.orderId);
    if (!paymentOrder) {
      throw new AppError(ErrorCodes.PAYMENT_ORDER_NOT_FOUND);
    }

    if (paymentOrder.userId !== data.userId) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    const wallet = await this._walletRepo.findByUserId(data.userId);
    if (!wallet) {
      throw new AppError(ErrorCodes.WALLET_NOT_FOUND);
    }

    if (paymentOrder.status === PaymentStatus.SUCCESS) {
      return {
        success: true,
        balance: wallet.balance.toNumber(),
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

    await this._settlementService.settleTopupSuccess({
      wallet,
      paymentOrder,
      paymentId: data.paymentId,
      metadata: {
        orderId: data.orderId,
        paymentId: data.paymentId,
      },
    });

    return {
      success: true,
      balance: wallet.balance.toNumber(),
      virtualAmountAdded: paymentOrder.virtualAmount,
    };
  }
}
