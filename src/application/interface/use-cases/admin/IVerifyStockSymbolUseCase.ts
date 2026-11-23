import {
  VerifyStockSymbolDTO,
  VerifyStockSymbolResponseDTO,
} from "../../../dto/admin/AdminStockDTOs";

export interface IVerifyStockSymbolUseCase {
  execute(dto: VerifyStockSymbolDTO): Promise<VerifyStockSymbolResponseDTO>;
}
