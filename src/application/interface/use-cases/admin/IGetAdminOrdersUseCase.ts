import {
  AdminOrdersQueryDTO,
  PaginatedAdminOrdersResponseDTO,
} from "../../../dto/admin/AdminOrderDTOs";

export interface IGetAdminOrdersUseCase {
  execute(query: AdminOrdersQueryDTO): Promise<PaginatedAdminOrdersResponseDTO>;
}
