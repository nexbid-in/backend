import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AdminOrderDetailsDTO } from "../../dto/admin/AdminOrderDTOs";
import { IGetAdminOrderDetailsUseCase } from "../../interface/use-cases/admin/IGetAdminOrderDetailsUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GetAdminOrderDetailsUseCase implements IGetAdminOrderDetailsUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(orderId: string): Promise<AdminOrderDetailsDTO> {
    const details = await this.orderRepo.findDetailsById(orderId);
    if (!details) {
      throw new AppError(ErrorCodes.ORDER_NOT_FOUND, "Order not found");
    }
    return details;
  }
}
