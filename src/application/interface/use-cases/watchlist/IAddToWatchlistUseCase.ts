import { AddToWatchlistRequestDTO, AddToWatchlistResponseDTO } from "../../../dto/watchlist/WatchlistDTO";

export interface IAddToWatchlistUseCase {
    execute(data: AddToWatchlistRequestDTO): Promise<AddToWatchlistResponseDTO>;
}