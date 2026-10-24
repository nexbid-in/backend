import { ICreateTopupOrderUseCase } from "../../interface/use-cases/wallet/ICreateTopupOrderUseCase";
import {
  CreateTopupOrderRequestDTO,
  CreateTopupOrderResponseDTO,
} from "../../dto/wallet/CreateTopupOrderDTO";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { IPaymentGatewayService } from "../../interface/services/IPaymentGatewayService";
import { PaymentOrder } from "../../../domain/entities/PaymentOrder";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class CreateTopupOrderUseCase implements ICreateTopupOrderUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _walletRepo: IWalletRepository,
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _paymentGateway: IPaymentGatewayService,
    private readonly _virtualCurrencyRate: number = 10
  ) {}

  async execute(data: CreateTopupOrderRequestDTO): Promise<CreateTopupOrderResponseDTO> {
    const user = await this._userRepo.findById(data.userId);
    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    const wallet = await this._walletRepo.findOrCreateByUserId(data.userId);
    if (!wallet.isActive()) {
      throw new AppError(ErrorCodes.WALLET_FROZEN);
    }

    const virtualAmount = data.realAmount * this._virtualCurrencyRate;
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const internalOrderId = `TOP-${randomSuffix}`;

    const amountInPaise = Math.round(data.realAmount * 100);

    const gatewayOrder = await this._paymentGateway.createOrder(
      amountInPaise,
      internalOrderId
    );

    const paymentOrder = PaymentOrder.create({
      id: internalOrderId,
      userId: data.userId,
      orderId: gatewayOrder.orderId,
      realAmount: data.realAmount,
      virtualAmount,
      status: "PENDING",
    });

    await this._paymentOrderRepo.save(paymentOrder);

    return {
      orderId: gatewayOrder.orderId,
      paymentOrderId: paymentOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      virtualAmount,
      keyId: this._paymentGateway.getKeyId(),
    };
  }
}
