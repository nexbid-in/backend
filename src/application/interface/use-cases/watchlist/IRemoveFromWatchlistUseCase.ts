import { RemoveFromWatchlistRequestDTO, RemoveFromWatchlistResponseDTO } from "../../../dto/watchlist/WatchlistDTO";

export interface IRemoveFromWatchlistUseCase {
    execute(data: RemoveFromWatchlistRequestDTO): Promise<RemoveFromWatchlistResponseDTO>;
}