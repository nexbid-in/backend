import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  CancelOrderRequestDTO,
  OrderResponseDTO,
} from "../../dto/trading/OrderDTOs";
import { ICancelOrderUseCase } from "../../interface/use-cases/trading/ICancelOrderUseCase";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { OrderCancellationService } from "../../services/trading/OrderCancellationService";

/**
 * Orchestrates user-initiated cancellation of an owned pending order.
 */
export class CancelOrderUseCase implements ICancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cancellationService: OrderCancellationService
  ) {}

  async execute(dto: CancelOrderRequestDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order || order.userId !== dto.userId) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
    }

    const cancelled = await this.cancellationService.cancelOrder(order);
    return OrderResponseMapper.toDTO(cancelled);
  }
}
