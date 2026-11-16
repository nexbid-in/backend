import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { Stock } from "../../../domain/entities/Stock";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { MarketStatusInfo } from "./MarketHoursService";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { env } from "../../../infrastructure/config/env";
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
    marketStatus: MarketStatusInfo
  ): Promise<Stock> {
    const stock = await this.stockRepo.findBySymbol(cleanSymbol);
    if (!stock || !stock.isActive) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }
    if (!stock.isTradable) {
      throw new AppError(ErrorCodes.STOCK_NOT_TRADABLE);
    }

    if (env.ENFORCE_MARKET_HOURS) {
      if (dto.isAmo) {
        if (marketStatus.isOpen) {
          throw new AppError(
            ErrorCodes.AMO_NOT_ALLOWED_DURING_MARKET,
            "After Market Orders (AMO) cannot be placed during live market hours (09:15 AM - 03:30 PM IST). Please place a regular order."
          );
        }
      } else {
        if (!marketStatus.isOpen) {
          throw new AppError(
            ErrorCodes.MARKET_CLOSED,
            `Indian Stock Exchange (NSE/BSE) is currently closed (${marketStatus.currentIstTime}). Regular trading hours are Monday - Friday, 09:15 AM to 03:30 PM IST. You can place an After Market Order (AMO).`
          );
        }

        if (dto.productType === ProductType.MIS && !marketStatus.isMisAllowed) {
          throw new AppError(
            ErrorCodes.MIS_ORDER_CUTOFF_EXCEEDED,
            "New intraday (MIS) orders are blocked after 03:20 PM IST due to auto-square-off cutoffs. Please place a CNC (Delivery) order or an AMO."
          );
        }
      }
    }

    if (dto.productType === ProductType.CNC && dto.side === OrderSide.SELL) {
      const holding = await this.positionRepo.findByUserAndSymbol(
        dto.userId,
        cleanSymbol,
        ProductType.CNC
      );

      if (!holding || holding.side !== PositionSide.LONG || holding.quantity < dto.quantity) {
        throw new AppError(
          ErrorCodes.SHORT_SELLING_NOT_ALLOWED_IN_CNC,
          "Short selling is only permitted under MIS (Intraday) product type"
        );
      }
    }

    return stock;
  }
}
