import {
  AdminStocksQueryDTO,
  PaginatedAdminStocksResponseDTO,
} from "../../../dto/admin/AdminStockDTOs";

export interface IGetAdminStocksUseCase {
  execute(query: AdminStocksQueryDTO): Promise<PaginatedAdminStocksResponseDTO>;
}
