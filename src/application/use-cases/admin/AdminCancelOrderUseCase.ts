import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { AdminCancelOrderDTO } from "../../dto/admin/AdminOrderDTOs";
import { OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { IAdminCancelOrderUseCase } from "../../interface/use-cases/admin/IAdminCancelOrderUseCase";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { OrderCancellationService } from "../../services/trading/OrderCancellationService";

/**
 * Orchestrates administrator-initiated cancellation of a pending order.
 */
export class AdminCancelOrderUseCase implements IAdminCancelOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cancellationService: OrderCancellationService
  ) {}

  async execute(dto: AdminCancelOrderDTO): Promise<OrderResponseDTO> {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND);
    }

    const cancelled = await this.cancellationService.cancelOrder(
      order,
      "Cancelled by administrator"
    );
    return OrderResponseMapper.toDTO(cancelled);
  }
}
