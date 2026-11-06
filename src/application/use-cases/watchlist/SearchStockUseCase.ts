import { ISearchStocksUseCase } from "../../interface/use-cases/watchlist/ISearchStocksUseCase";
import { SearchStocksRequestDTO, SearchStocksResponseDTO } from "../../dto/watchlist/SearchStocksDTO";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { WatchlistDTOMapper } from "../../mapper/watchlist/WatchlistDTOMapper";

export class SearchStocksUseCase implements ISearchStocksUseCase {
  constructor(private readonly _stockRepo: IStockRepository) {}

  async execute(data: SearchStocksRequestDTO): Promise<SearchStocksResponseDTO> {
    const page = data.page && data.page > 0 ? data.page : 1;
    const limit = data.limit && data.limit > 0 ? Math.min(data.limit, 50) : 20;

    const result = await this._stockRepo.search({
      query: data.query,
      type: data.type,
      page,
      limit,
    });

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / limit);
    const hasMore = page < totalPages;

    return {
      stocks: result.stocks.map((stock) => WatchlistDTOMapper.toStockDTO(stock)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasMore,
      },
      counts: result.counts,
    };
  }
}
