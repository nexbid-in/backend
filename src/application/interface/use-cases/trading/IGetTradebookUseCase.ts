import {
  TradebookQueryDTO,
  GetTradebookResponseDTO,
} from "../../../dto/trading/TradebookDTOs";

export interface IGetTradebookUseCase {
  execute(
    userId: string,
    query: TradebookQueryDTO
  ): Promise<GetTradebookResponseDTO>;
}
