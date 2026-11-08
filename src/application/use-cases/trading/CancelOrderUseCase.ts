import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { CancelOrderRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class CancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly walletRepo: IWalletRepository
  ) {}

  async execute(dto: CancelOrderRequestDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order || order.userId !== dto.userId) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND, "Order not found");
    }

    if (!order.canBeCancelled()) {
      throw new AppError(
        ErrorCodes.ORDER_CANNOT_BE_CANCELLED,
        "Only pending orders can be cancelled"
      );
    }

    // 1. Mark order as cancelled
    order.markCancelled();
    await this.orderRepo.update(order);

    // 2. Release any blocked margin held by this pending order
    if (order.blockedMargin > 0) {
      const wallet = await this.walletRepo.findOrCreateByUserId(dto.userId);
      wallet.releaseMargin(order.blockedMargin);
      await this.walletRepo.update(wallet);
    }

    return {
      id: order.id,
      userId: order.userId,
      stockId: order.stockId,
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      productType: order.productType,
      status: order.status,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
      price: order.price,
      averagePrice: order.averagePrice,
      triggerPrice: order.triggerPrice,
      rejectionReason: order.rejectionReason,
      blockedMargin: order.blockedMargin,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

