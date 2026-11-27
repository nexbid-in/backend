import { OrderSide, OrderType } from "../../../domain/entities/trading/Order";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { IMarketQuoteReader } from "../../interface/services/IMarketDataService";

/**
 * Resolves reference and execution prices for market and limit orders from live quotes.
 */
export class OrderPricingService {
  constructor(private readonly quoteReader: IMarketQuoteReader) {}

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

    const referencePrice = await this.resolveMarketPrice(
      cleanSymbol,
      dto.side,
      100
    );

    if (referencePrice <= 0) {
      throw new AppError(ErrorCodes.MARKET_DATA_SERVICE_UNAVAILABLE);
    }

    return referencePrice;
  }

  /**
   * Resolves the executable market price using best ask (BUY) or best bid (SELL),
   * falling back to LTP and an optional caller-provided fallback price.
   */
  async resolveMarketPrice(
    symbol: string,
    side: OrderSide,
    fallbackPrice = 0
  ): Promise<number> {
    const quote = await this.quoteReader.getQuote(symbol);
    const ltp = quote?.ltp && quote.ltp > 0 ? quote.ltp : 0;

    if (side === OrderSide.BUY) {
      const ask = quote?.askPrice && quote.askPrice > 0 ? quote.askPrice : 0;
      if (ask > 0) return ask;
      if (ltp > 0) return ltp;
      return fallbackPrice;
    }

    const bid = quote?.bidPrice && quote.bidPrice > 0 ? quote.bidPrice : 0;
    if (bid > 0) return bid;
    if (ltp > 0) return ltp;
    return fallbackPrice;
  }
}
