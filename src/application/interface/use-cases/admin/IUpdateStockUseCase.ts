import {
  AdminStockItemDTO,
  UpdateStockDTO,
} from "../../../dto/admin/AdminStockDTOs";

export interface IUpdateStockUseCase {
  execute(dto: UpdateStockDTO): Promise<AdminStockItemDTO>;
}
