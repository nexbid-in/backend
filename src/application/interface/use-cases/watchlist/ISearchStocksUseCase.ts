import { SearchStocksRequestDTO, SearchStocksResponseDTO } from "../../../dto/watchlist/SearchStocksDTO";

export interface ISearchStocksUseCase {
    execute(data: SearchStocksRequestDTO): Promise<SearchStocksResponseDTO>;
}