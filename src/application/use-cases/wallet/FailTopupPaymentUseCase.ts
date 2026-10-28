import { IFailTopupPaymentUseCase } from "../../interface/use-cases/wallet/IFailTopupPaymentUseCase";
import {
  FailTopupPaymentRequestDTO,
  FailTopupPaymentResponseDTO,
} from "../../dto/wallet/FailTopupPaymentDTO";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { PaymentStatus } from "../../../domain/entities/PaymentOrder";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class FailTopupPaymentUseCase implements IFailTopupPaymentUseCase {
  constructor(
    private readonly _paymentOrderRepo: IPaymentOrderRepository
  ) {}

  async execute(data: FailTopupPaymentRequestDTO): Promise<FailTopupPaymentResponseDTO> {
    const paymentOrder = await this._paymentOrderRepo.findByOrderId(data.orderId);
    if (!paymentOrder) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
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

    return {
      success: true,
      orderId: paymentOrder.orderId,
      status: PaymentStatus.FAILED,
    };
  }
}
