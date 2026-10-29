import { IGetUserWatchlistUseCase } from "../../interface/use-cases/watchlist/IGetUserWatchlistUseCase";
import { GetWatchlistRequestDTO, GetWatchlistResponseDTO } from "../../dto/watchlist/WatchlistDTO";
import { IWatchlistRepository } from "../../../domain/repositories/watchlist/IWatchlistRepository";
import { WatchlistDTOMapper } from "../../mapper/watchlist/WatchlistDTOMapper";

export class GetUserWatchlistUseCase implements IGetUserWatchlistUseCase {
  constructor(private readonly _watchlistRepo: IWatchlistRepository) {}

  async execute(data: GetWatchlistRequestDTO): Promise<GetWatchlistResponseDTO> {
    const items = await this._watchlistRepo.findByUserId(data.userId);

    return {
      items: items
        .filter((item) => item.stock !== null && item.stock !== undefined)
        .map((item) => WatchlistDTOMapper.toItemDTO(item)),
    };
  }
}
