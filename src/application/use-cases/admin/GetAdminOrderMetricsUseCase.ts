import { IAdminOrderQueryRepository } from "../../../domain/repositories/admin/IAdminOrderQueryRepository";
import { AdminOrderMetricsDTO } from "../../dto/admin/AdminOrderDTOs";
import { IGetAdminOrderMetricsUseCase } from "../../interface/use-cases/admin/IGetAdminOrderMetricsUseCase";

export class GetAdminOrderMetricsUseCase implements IGetAdminOrderMetricsUseCase {
  constructor(private readonly orderQueryRepo: IAdminOrderQueryRepository) {}

  async execute(): Promise<AdminOrderMetricsDTO> {
    return this.orderQueryRepo.getAggregateMetrics();
  }
}
