import { ISearchStocksUseCase } from "../../interface/use-cases/watchlist/ISearchStocksUseCase";
import { SearchStocksRequestDTO, SearchStocksResponseDTO } from "../../dto/watchlist/SearchStocksDTO";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { WatchlistDTOMapper } from "../../mapper/watchlist/WatchlistDTOMapper";

export class SearchStocksUseCase implements ISearchStocksUseCase {
  constructor(private readonly _stockRepo: IStockRepository) {}

  async execute(data: SearchStocksRequestDTO): Promise<SearchStocksResponseDTO> {
    const trimmed = data.query?.trim() ?? "";
    if (!trimmed) {
      return { stocks: [] };
    }

    const stocks = await this._stockRepo.search(trimmed, data.limit ?? 15);

    return {
      stocks: stocks.map((stock) => WatchlistDTOMapper.toStockDTO(stock)),
    };
  }
}
