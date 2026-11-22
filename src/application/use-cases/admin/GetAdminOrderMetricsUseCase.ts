import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AdminOrderMetricsDTO } from "../../dto/admin/AdminOrderDTOs";
import { IGetAdminOrderMetricsUseCase } from "../../interface/use-cases/admin/IGetAdminOrderMetricsUseCase";

export class GetAdminOrderMetricsUseCase implements IGetAdminOrderMetricsUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(): Promise<AdminOrderMetricsDTO> {
    return this.orderRepo.getAggregateMetrics();
  }
}
