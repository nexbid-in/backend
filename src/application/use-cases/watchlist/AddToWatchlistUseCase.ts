import crypto from "crypto";
import { IAddToWatchlistUseCase } from "../../interface/use-cases/watchlist/IAddToWatchlistUseCase";
import { AddToWatchlistRequestDTO, AddToWatchlistResponseDTO } from "../../dto/watchlist/WatchlistDTO";
import { IWatchlistRepository } from "../../../domain/repositories/watchlist/IWatchlistRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { WatchlistItem } from "../../../domain/entities/WatchlistItem";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { WatchlistDTOMapper } from "../../mapper/watchlist/WatchlistDTOMapper";

export class AddToWatchlistUseCase implements IAddToWatchlistUseCase {
    private static readonly MAX_WATCHLIST_LIMIT = 100;

  constructor(
    private readonly _watchlistRepo: IWatchlistRepository,
    private readonly _stockRepo: IStockRepository
  ) {}

  async execute(data: AddToWatchlistRequestDTO): Promise<AddToWatchlistResponseDTO> {

    const [stock, existing, currentCount] = await Promise.all([
        this._stockRepo.findById(data.stockId),
        this._watchlistRepo.findByUserAndStockId(data.userId, data.stockId),
        this._watchlistRepo.countByUserId(data.userId),
    ]);
    
    if (!stock || !stock.isActive) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    if (existing) {
      throw new AppError(ErrorCodes.STOCK_ALREADY_IN_WATCHLIST);
    }

    if (currentCount >= AddToWatchlistUseCase.MAX_WATCHLIST_LIMIT) {
        throw new AppError(ErrorCodes.WATCHLIST_LIMIT_EXCEEDED);
    }

    const watchlistItem = WatchlistItem.create({
      id: crypto.randomUUID(),
      userId: data.userId,
      stockId: stock.id,
      order: currentCount,
      stock,
    });

    await this._watchlistRepo.save(watchlistItem);

    return {
      success: true,
      item: WatchlistDTOMapper.toItemDTO(watchlistItem),
    };
  }
}
