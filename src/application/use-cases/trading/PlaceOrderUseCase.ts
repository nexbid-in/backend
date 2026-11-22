import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { Order, OrderStatus, OrderType } from "../../../domain/entities/trading/Order";
import { TradeValidationService } from "../../services/trading/TradeValidationService";
import { OrderPricingService } from "../../services/trading/OrderPricingService";
import { OrderMarginService } from "../../services/trading/OrderMarginService";
import { OrderExecutionService } from "../../services/trading/OrderExecutionService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { env } from "../../../infrastructure/config/env";
import { PlaceOrderRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { IPlaceOrderUseCase } from "../../interface/use-cases/trading/IPlaceOrderUseCase";
import { IIdGenerator } from "../../interface/services/IIdGenerator";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { HttpErrorMap } from "../../../presentation/http/constants/HttpErrorMap";

export class PlaceOrderUseCase implements IPlaceOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly validationService: TradeValidationService,
    private readonly pricingService: OrderPricingService,
    private readonly marginService: OrderMarginService,
    private readonly executionService: OrderExecutionService,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: PlaceOrderRequestDTO): Promise<OrderResponseDTO> {
    const cleanSymbol = dto.symbol.toUpperCase().trim();
    const marketStatus = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);

    const stock = await this.stockRepo.findBySymbol(cleanSymbol);
    if (!stock || !stock.isActive) {
      throw new AppError(ErrorCodes.STOCK_NOT_FOUND);
    }

    let order: Order | null = null;
    let blockedMargin = 0;

    try {
      await this.validationService.validateOrderPlacement(
        dto,
        cleanSymbol,
        marketStatus,
        stock
      );

      const referencePrice = await this.pricingService.resolveReferencePrice(
        dto,
        cleanSymbol
      );

      blockedMargin = await this.marginService.validateAndHoldMargin(
        dto,
        cleanSymbol,
        referencePrice
      );

      order = Order.create({
        id: this.idGenerator.generate("ORD"),
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
        blockedMargin,
        isAmo: dto.isAmo ?? false,
      });

      order = await this.orderRepo.save(order);

      order = await this.executionService.dispatchOrder(
        order,
        referencePrice,
        marketStatus
      );

      return OrderResponseMapper.toDTO(order);
    } catch (err: unknown) {
      if (blockedMargin > 0) {
        await this.marginService.releaseMargin(dto.userId, blockedMargin);
      }

      const rejectionReason = this.extractRejectionReason(err);

      if (order) {
        order.markRejected(rejectionReason);
        await this.orderRepo.update(order);
      } else {
        const rejectedOrder = Order.create({
          id: this.idGenerator.generate("ORD"),
          userId: dto.userId,
          stockId: stock.id,
          symbol: cleanSymbol,
          side: dto.side,
          orderType: dto.orderType,
          productType: dto.productType,
          status: OrderStatus.REJECTED,
          quantity: dto.quantity,
          price: dto.orderType === OrderType.LIMIT ? dto.price : null,
          triggerPrice: dto.triggerPrice ?? null,
          blockedMargin: 0,
          rejectionReason,
          isAmo: dto.isAmo ?? false,
        });

        await this.orderRepo.save(rejectedOrder);
      }

      throw err;
    }
  }

  private extractRejectionReason(err: unknown): string {
    if (err instanceof AppError) {
      if (err.message && err.message.trim() !== "") {
        return err.message;
      }
      const mapped = HttpErrorMap[err.code];
      if (mapped?.message) {
        return mapped.message;
      }
    }
    if (err instanceof Error && err.message && err.message.trim() !== "") {
      return err.message;
    }
    return "Order rejected by risk management system";
  }
}
