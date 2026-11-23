import {
  AdminStockItemDTO,
  CreateStockDTO,
} from "../../../dto/admin/AdminStockDTOs";

export interface ICreateStockUseCase {
  execute(dto: CreateStockDTO): Promise<AdminStockItemDTO>;
}
