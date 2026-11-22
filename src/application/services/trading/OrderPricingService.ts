import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { OrderSide, OrderType } from "../../../domain/entities/trading/Order";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class OrderPricingService {
  constructor(private readonly marketDataService: IMarketDataService) {}

  async resolveReferencePrice(
    dto: PlaceOrderRequestDTO,
    cleanSymbol: string
  ): Promise<number> {
    if (dto.orderType === OrderType.LIMIT) {
      if (!dto.price || dto.price <= 0) {
        throw new AppError(ErrorCodes.INVALID_ORDER_PRICE);
      }
      return dto.price;
    }

    const quote = await this.marketDataService.getQuote(cleanSymbol);
    const bestAsk = quote?.askPrice ?? quote?.ltp ?? 0;
    const bestBid = quote?.bidPrice ?? quote?.ltp ?? 0;

    let referencePrice: number;
    if (dto.side === OrderSide.BUY) {
      referencePrice = bestAsk > 0 ? bestAsk : +(quote?.ltp ?? 100);
    } else {
      referencePrice = bestBid > 0 ? bestBid : +(quote?.ltp ?? 100);
    }

    if (referencePrice <= 0) {
      throw new AppError(
        ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE,
        "Unable to determine current market price for order placement"
      );
    }

    return referencePrice;
  }
}
