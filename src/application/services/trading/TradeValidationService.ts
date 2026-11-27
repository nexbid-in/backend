import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { Stock } from "../../../domain/entities/Stock";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { MarketStatusInfo } from "./MarketHoursService";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class TradeValidationService {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly positionRepo: IPositionRepository
  ) {}

  async validateOrderPlacement(
    dto: PlaceOrderRequestDTO,
    cleanSymbol: string,
    marketStatus: MarketStatusInfo,
    existingStock?: Stock
  ): Promise<Stock> {
    const stock =
      existingStock ?? (await this.stockRepo.findBySymbol(cleanSymbol));
    if (!stock || !stock.isActive) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }
    if (!stock.isTradable) {
      throw new AppError(ErrorCodes.STOCK_NOT_TRADABLE);
    }

    if (marketStatus.enforceMarketHours) {
      if (dto.isAmo) {
        if (marketStatus.isOpen) {
          throw new AppError(ErrorCodes.AMO_NOT_ALLOWED_DURING_MARKET);
        }
      } else {
        if (!marketStatus.isOpen) {
          throw new AppError(ErrorCodes.MARKET_CLOSED);
        }

        if (dto.productType === ProductType.MIS && !marketStatus.isMisAllowed) {
          throw new AppError(ErrorCodes.MIS_ORDER_CUTOFF_EXCEEDED);
        }
      }
    }

    if (dto.productType === ProductType.CNC && dto.side === OrderSide.SELL) {
      const holding = await this.positionRepo.findByUserAndSymbol(
        dto.userId,
        cleanSymbol,
        ProductType.CNC
      );

      if (
        !holding ||
        holding.side !== PositionSide.LONG ||
        holding.quantity < dto.quantity
      ) {
        throw new AppError(ErrorCodes.SHORT_SELLING_NOT_ALLOWED_IN_CNC);
      }
    }

    return stock;
  }
}
