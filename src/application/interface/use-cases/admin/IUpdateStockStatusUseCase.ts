import {
  AdminStockItemDTO,
  UpdateStockStatusDTO,
} from "../../../dto/admin/AdminStockDTOs";

export interface IUpdateStockStatusUseCase {
  execute(dto: UpdateStockStatusDTO): Promise<AdminStockItemDTO>;
}
