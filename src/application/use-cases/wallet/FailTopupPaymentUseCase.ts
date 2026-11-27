import { PaymentStatus } from "../../../domain/entities/PaymentOrder";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  FailTopupPaymentRequestDTO,
  FailTopupPaymentResponseDTO,
} from "../../dto/wallet/FailTopupPaymentDTO";
import { ILogger } from "../../interface/services/ILogger";
import { IFailTopupPaymentUseCase } from "../../interface/use-cases/wallet/IFailTopupPaymentUseCase";

export class FailTopupPaymentUseCase implements IFailTopupPaymentUseCase {
  constructor(
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _logger: ILogger
  ) {}

  async execute(
    data: FailTopupPaymentRequestDTO
  ): Promise<FailTopupPaymentResponseDTO> {
    const paymentOrder = await this._paymentOrderRepo.findByOrderId(data.orderId);
    if (!paymentOrder) {
      throw new AppError(ErrorCodes.PAYMENT_ORDER_NOT_FOUND);
    }

    if (paymentOrder.userId !== data.userId) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    if (paymentOrder.status === PaymentStatus.SUCCESS) {
      return {
        success: true,
        orderId: paymentOrder.orderId,
        status: PaymentStatus.SUCCESS,
      };
    }

    if (paymentOrder.status === PaymentStatus.FAILED) {
      return {
        success: true,
        orderId: paymentOrder.orderId,
        status: PaymentStatus.FAILED,
      };
    }

    paymentOrder.markAsFailed(data.paymentId);
    await this._paymentOrderRepo.save(paymentOrder);

    this._logger.info(
      {
        orderId: data.orderId,
        paymentId: data.paymentId,
        reason: data.reason ?? "No reason provided",
        userId: data.userId,
        status: PaymentStatus.FAILED,
      },
      "Top-up payment failure processed"
    );

    return {
      success: true,
      orderId: paymentOrder.orderId,
      status: PaymentStatus.FAILED,
    };
  }
}
