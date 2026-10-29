import { GetWatchlistRequestDTO, GetWatchlistResponseDTO } from "../../../dto/watchlist/WatchlistDTO";

export interface IGetUserWatchlistUseCase {
    execute(data: GetWatchlistRequestDTO): Promise<GetWatchlistResponseDTO>;
}