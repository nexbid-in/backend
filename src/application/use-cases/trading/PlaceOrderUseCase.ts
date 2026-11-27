import { Order, OrderStatus, OrderType } from "../../../domain/entities/trading/Order";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { OrderResponseDTO, PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { IIdGenerator } from "../../interface/services/IIdGenerator";
import { IPlaceOrderUseCase } from "../../interface/use-cases/trading/IPlaceOrderUseCase";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { OrderExecutionService } from "../../services/trading/OrderExecutionService";
import { OrderMarginService } from "../../services/trading/OrderMarginService";
import { OrderPricingService } from "../../services/trading/OrderPricingService";
import { OrderRejectionService } from "../../services/trading/OrderRejectionService";
import { TradeValidationService } from "../../services/trading/TradeValidationService";

/**
 * Orchestrates placing a trading order across validation, pricing, margin holding,
 * persistence, execution dispatch, and failure compensation.
 */
export class PlaceOrderUseCase implements IPlaceOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly validationService: TradeValidationService,
    private readonly pricingService: OrderPricingService,
    private readonly marginService: OrderMarginService,
    private readonly executionService: OrderExecutionService,
    private readonly rejectionService: OrderRejectionService,
    private readonly idGenerator: IIdGenerator,
    private readonly enforceMarketHours: boolean
  ) {}

  async execute(dto: PlaceOrderRequestDTO): Promise<OrderResponseDTO> {
    const cleanSymbol = dto.symbol.toUpperCase().trim();
    const marketStatus = MarketHoursService.getMarketStatus(
      this.enforceMarketHours
    );

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
      await this.rejectionService.handlePlacementFailure({
        dto,
        stockId: stock.id,
        cleanSymbol,
        existingOrder: order,
        blockedMargin,
        error: err,
      });

      throw err;
    }
  }
}
