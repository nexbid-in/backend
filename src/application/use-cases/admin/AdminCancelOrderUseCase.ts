import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IOrderMatchingEngine } from "../../interface/services/IOrderMatchingEngine";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { AdminCancelOrderDTO } from "../../dto/admin/AdminOrderDTOs";
import { OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { IAdminCancelOrderUseCase } from "../../interface/use-cases/admin/IAdminCancelOrderUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class AdminCancelOrderUseCase implements IAdminCancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly matchingEngine: IOrderMatchingEngine
  ) {}

  async execute(dto: AdminCancelOrderDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
    }

    if (!order.canBeCancelled()) {
      throw new AppError(ErrorCodes.ORDER_CANNOT_BE_CANCELLED);
    }

    order.markCancelled("Cancelled by administrator");
    await this.orderRepo.update(order);

    this.matchingEngine.removeOrderFromBook(order.id, order.symbol);

    if (order.blockedMargin > 0) {
      const wallet = await this.walletRepo.findOrCreateByUserId(order.userId);
      wallet.releaseMargin(order.blockedMargin);
      await this.walletRepo.update(wallet);
    }

    return OrderResponseMapper.toDTO(order);
  }
}
