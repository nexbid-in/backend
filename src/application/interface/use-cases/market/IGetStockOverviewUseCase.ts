import {
  GetStockOverviewRequestDTO,
  StockOverviewResponseDTO,
} from "../../../dto/market/StockOverviewDTO";

export interface IGetStockOverviewUseCase {
  execute(data: GetStockOverviewRequestDTO): Promise<StockOverviewResponseDTO>;
}

