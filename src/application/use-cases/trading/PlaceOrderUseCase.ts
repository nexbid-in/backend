import crypto from "crypto";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { OrderMatchingEngine } from "../../../infrastructure/external/trading/OrderMatchingEngine";
import { Order, OrderSide, OrderType, ProductType, OrderStatus } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { MarginCalculatorService } from "../../services/trading/MarginCalculatorService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { env } from "../../../infrastructure/config/env";
import { PlaceOrderRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { IPlaceOrderUseCase } from "../../interface/use-cases/trading/IPlaceOrderUseCase";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class PlaceOrderUseCase implements IPlaceOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly stockRepo: IStockRepository,
    private readonly marketDataService: IMarketDataService,
    private readonly matchingEngine: OrderMatchingEngine
  ) {}

  async execute(dto: PlaceOrderRequestDTO): Promise<OrderResponseDTO> {
    const cleanSymbol = dto.symbol.toUpperCase().trim();

    const stock = await this.stockRepo.findBySymbol(cleanSymbol);
    if (!stock || !stock.isActive) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }
    if (!stock.isTradable) {
      throw new AppError(ErrorCodes.STOCK_NOT_TRADABLE);
    }

    const marketStatus = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);

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

    let referencePrice: number;
    const quote = await this.marketDataService.getQuote(cleanSymbol);

    if (dto.orderType === OrderType.LIMIT) {
      if (!dto.price || dto.price <= 0) {
        throw new AppError(ErrorCodes.INVALID_ORDER_PRICE);
      }
      referencePrice = dto.price;
    } else {
      const bestAsk = quote?.askPrice ?? quote?.ltp ?? 0;
      const bestBid = quote?.bidPrice ?? quote?.ltp ?? 0;

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
    }

    const existingPosition = await this.positionRepo.findByUserAndSymbol(
      dto.userId,
      cleanSymbol,
      dto.productType
    );

    const isCoveringPosition =
      existingPosition &&
      existingPosition.isOpen() &&
      ((existingPosition.side === PositionSide.LONG && dto.side === OrderSide.SELL) ||
        (existingPosition.side === PositionSide.SHORT && dto.side === OrderSide.BUY));

    let requiredMargin = 0;
    if (!isCoveringPosition) {
      requiredMargin = MarginCalculatorService.calculateRequiredMargin(
        dto.productType,
        dto.quantity,
        referencePrice
      );
    }

    const wallet = await this.walletRepo.findOrCreateByUserId(dto.userId);
    if (!wallet.isActive()) {
      throw new AppError(ErrorCodes.WALLET_FROZEN);
    }

    if (requiredMargin > 0) {
      if (wallet.balance < requiredMargin) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_FUNDS,
          `Insufficient funds. Required margin: ₹${requiredMargin.toFixed(2)}, Available: ₹${wallet.balance.toFixed(2)}`
        );
      }

      if (dto.productType === ProductType.MIS || dto.orderType === OrderType.LIMIT) {
        wallet.blockMargin(requiredMargin);
        await this.walletRepo.update(wallet);
      }
    }

    let order = Order.create({
      id: crypto.randomUUID(),
      userId: dto.userId,
      stockId: stock.id,
      symbol: cleanSymbol,
      side: dto.side,
      orderType: dto.orderType,
      productType: dto.productType,
      status: OrderStatus.PENDING,
      quantity: dto.quantity,
      price: dto.orderType === OrderType.LIMIT ? dto.price : null,
      triggerPrice: dto.triggerPrice ?? null,
      blockedMargin: requiredMargin,
      isAmo: dto.isAmo ?? false,
    });

    order = await this.orderRepo.save(order);

    const canExecuteImmediately =
      dto.orderType === OrderType.MARKET &&
      !dto.isAmo &&
      (!env.ENFORCE_MARKET_HOURS || marketStatus.isOpen);

    if (canExecuteImmediately) {
      order = await this.matchingEngine.executeOrder(order, referencePrice);
    } else {
      this.matchingEngine.addOrderToBook(order);
      await this.marketDataService.subscribe([order.symbol]);
    }

    return {
      id: order.id,
      userId: order.userId,
      stockId: order.stockId,
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      productType: order.productType,
      status: order.status,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
      price: order.price,
      averagePrice: order.averagePrice,
      triggerPrice: order.triggerPrice,
      rejectionReason: order.rejectionReason,
      blockedMargin: order.blockedMargin,
      isAmo: order.isAmo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

