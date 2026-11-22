import { AdminCancelOrderDTO } from "../../../dto/admin/AdminOrderDTOs";
import { OrderResponseDTO } from "../../../dto/trading/OrderDTOs";

export interface IAdminCancelOrderUseCase {
  execute(dto: AdminCancelOrderDTO): Promise<OrderResponseDTO>;
}
