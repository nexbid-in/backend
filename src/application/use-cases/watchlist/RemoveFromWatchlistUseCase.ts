import { IRemoveFromWatchlistUseCase } from "../../interface/use-cases/watchlist/IRemoveFromWatchlistUseCase";
import { RemoveFromWatchlistRequestDTO, RemoveFromWatchlistResponseDTO } from "../../dto/watchlist/WatchlistDTO";
import { IWatchlistRepository } from "../../../domain/repositories/watchlist/IWatchlistRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class RemoveFromWatchlistUseCase implements IRemoveFromWatchlistUseCase {
  constructor(private readonly _watchlistRepo: IWatchlistRepository) {}

  async execute(data: RemoveFromWatchlistRequestDTO): Promise<RemoveFromWatchlistResponseDTO> {
    const existing = await this._watchlistRepo.findByUserAndStockId(data.userId, data.stockId);
    if (!existing) {
      throw new AppError(ErrorCodes.WATCHLIST_ITEM_NOT_FOUND);
    }

    await this._watchlistRepo.delete(data.userId, data.stockId);

    return {
      success: true,
      message: "Stock removed from watchlist",
    };
  }
}
