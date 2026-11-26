import { DashboardOverviewResponseDTO } from "../../../dto/dashboard/DashboardOverviewDTO";

export interface IGetDashboardOverviewUseCase {
  execute(userId: string): Promise<DashboardOverviewResponseDTO>;
}
