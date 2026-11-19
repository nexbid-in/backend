import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
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

export class PlaceOrderUseCase implements IPlaceOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly validationService: TradeValidationService,
    private readonly pricingService: OrderPricingService,
    private readonly marginService: OrderMarginService,
    private readonly executionService: OrderExecutionService,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: PlaceOrderRequestDTO): Promise<OrderResponseDTO> {
    const cleanSymbol = dto.symbol.toUpperCase().trim();
    const marketStatus = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);

    const stock = await this.validationService.validateOrderPlacement(
      dto,
      cleanSymbol,
      marketStatus
    );

    const referencePrice = await this.pricingService.resolveReferencePrice(
      dto,
      cleanSymbol
    );

    const blockedMargin = await this.marginService.validateAndHoldMargin(
      dto,
      cleanSymbol,
      referencePrice
    );

    let order = Order.create({
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
  }
}
