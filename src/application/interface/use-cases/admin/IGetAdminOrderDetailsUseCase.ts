import { AdminOrderDetailsDTO } from "../../../dto/admin/AdminOrderDTOs";

export interface IGetAdminOrderDetailsUseCase {
  execute(orderId: string): Promise<AdminOrderDetailsDTO>;
}
