import { Stock, InstrumentType } from "../../../domain/entities/Stock";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import {
  CreateStockDTO,
  AdminStockItemDTO,
} from "../../dto/admin/AdminStockDTOs";
import { ICreateStockUseCase } from "../../interface/use-cases/admin/ICreateStockUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { MarketSymbolMapper } from "../../../infrastructure/external/market/MarketSymbolMapper";

export class CreateStockUseCase implements ICreateStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(dto: CreateStockDTO): Promise<AdminStockItemDTO> {
    const symbol = dto.symbol.toUpperCase().trim();
    const existing = await this.stockRepo.findBySymbol(symbol);
    if (existing) {
      throw new AppError(
        ErrorCodes.STOCK_SYMBOL_ALREADY_EXISTS,
        "An instrument with this symbol already exists."
      );
    }

    const feedSymbol = dto.feedSymbol?.toUpperCase().trim() || null;
    if (feedSymbol) {
      const existingFeed = await this.stockRepo.findByFeedSymbol(feedSymbol);
      if (existingFeed) {
        throw new AppError(
          ErrorCodes.STOCK_FEED_SYMBOL_ALREADY_EXISTS,
          "This feed symbol is already mapped to another instrument."
        );
      }
    }

    const targetFeedSymbol = feedSymbol ?? MarketSymbolMapper.toFeedSymbol(symbol);
    if (this.marketDataService.verifySymbol) {
      const verification = await this.marketDataService.verifySymbol(targetFeedSymbol);
      if (!verification.valid) {
        throw new AppError(
          ErrorCodes.INVALID_BROKER_FEED_SYMBOL,
          `Instrument ticker '${targetFeedSymbol}' was not recognized by the exchange feed. Please check symbol spelling.`
        );
      }
    }

    const isTradable =
      dto.type === InstrumentType.INDEX
        ? false
        : dto.isTradable !== undefined
        ? dto.isTradable
        : true;

    const stock = Stock.create({
      symbol,
      name: dto.name.trim(),
      exchange: dto.exchange?.toUpperCase().trim() || "NSE",
      sector: dto.sector?.trim() || null,
      type: dto.type,
      feedSymbol,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isTradable,
    });

    const saved = await this.stockRepo.save(stock);

    if (saved.feedSymbol) {
      MarketSymbolMapper.register(saved.symbol, saved.feedSymbol);
    }

    return {
      id: saved.id,
      symbol: saved.symbol,
      name: saved.name,
      exchange: saved.exchange,
      sector: saved.sector,
      type: saved.type,
      feedSymbol: saved.feedSymbol,
      isActive: saved.isActive,
      isTradable: saved.isTradable,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      orderCount: 0,
    };
  }
}
