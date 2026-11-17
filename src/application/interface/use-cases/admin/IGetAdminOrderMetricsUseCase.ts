import { AdminOrderMetricsDTO } from "../../../dto/admin/AdminOrderDTOs";

export interface IGetAdminOrderMetricsUseCase {
  execute(): Promise<AdminOrderMetricsDTO>;
}
