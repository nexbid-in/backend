import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IOrderMatchingEngine } from "../../interface/services/IOrderMatchingEngine";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { CancelOrderRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { ICancelOrderUseCase } from "../../interface/use-cases/trading/ICancelOrderUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class CancelOrderUseCase implements ICancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly matchingEngine: IOrderMatchingEngine
  ) {}

  async execute(dto: CancelOrderRequestDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order || order.userId !== dto.userId) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
    }

    if (!order.canBeCancelled()) {
      throw new AppError(ErrorCodes.ORDER_CANNOT_BE_CANCELLED);
    }

    order.markCancelled();
    await this.orderRepo.update(order);

    this.matchingEngine.removeOrderFromBook(order.id, order.symbol);

    if (order.blockedMargin > 0) {
      const wallet = await this.walletRepo.findOrCreateByUserId(dto.userId);
      wallet.releaseMargin(order.blockedMargin);
      await this.walletRepo.update(wallet);
    }

    return OrderResponseMapper.toDTO(order);
  }
}

