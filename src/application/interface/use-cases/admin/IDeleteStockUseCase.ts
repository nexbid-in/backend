import { DeleteStockDTO } from "../../../dto/admin/AdminStockDTOs";

export interface IDeleteStockUseCase {
  execute(dto: DeleteStockDTO): Promise<void>;
}
