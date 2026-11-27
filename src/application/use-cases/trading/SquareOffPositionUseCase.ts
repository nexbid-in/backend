import { Order, OrderSide, OrderStatus, OrderType } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { PositionsValuationCalculator } from "../../../domain/services/trading/PositionsValuationCalculator";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  PositionResponseDTO,
  SquareOffPositionRequestDTO,
} from "../../dto/trading/PositionDTOs";
import { IIdGenerator } from "../../interface/services/IIdGenerator";
import { ISquareOffPositionUseCase } from "../../interface/use-cases/trading/ISquareOffPositionUseCase";
import { PositionDTOMapper } from "../../mapper/trading/PositionDTOMapper";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { OrderExecutionService } from "../../services/trading/OrderExecutionService";
import { OrderPricingService } from "../../services/trading/OrderPricingService";

/**
 * Orchestrates closing an open position via an opposing market order,
 * dispatching execution, and returning the updated position snapshot.
 */
export class SquareOffPositionUseCase implements ISquareOffPositionUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly pricingService: OrderPricingService,
    private readonly executionService: OrderExecutionService,
    private readonly idGenerator: IIdGenerator,
    private readonly enforceMarketHours: boolean
  ) {}

  async execute(dto: SquareOffPositionRequestDTO): Promise<PositionResponseDTO> {
    const position = await this.positionRepo.findById(dto.positionId);
    if (!position || position.userId !== dto.userId) {
      throw new AppError(ErrorCodes.POSITION_NOT_FOUND);
    }

    if (!position.isOpen()) {
      throw new AppError(ErrorCodes.POSITION_ALREADY_CLOSED);
    }

    const marketStatus = MarketHoursService.getMarketStatus(
      this.enforceMarketHours
    );
    const isAmo = this.enforceMarketHours ? !marketStatus.isOpen : false;
    const opposingSide =
      position.side === PositionSide.LONG ? OrderSide.SELL : OrderSide.BUY;

    const exitPrice = await this.pricingService.resolveMarketPrice(
      position.symbol,
      opposingSide,
      position.averagePrice
    );

    let squareOffOrder = Order.create({
      id: this.idGenerator.generate("ORD"),
      userId: dto.userId,
      stockId: position.stockId,
      symbol: position.symbol,
      side: opposingSide,
      orderType: OrderType.MARKET,
      productType: position.productType,
      status: OrderStatus.PENDING,
      quantity: position.quantity,
      blockedMargin: 0,
      isAmo,
    });

    squareOffOrder = await this.orderRepo.save(squareOffOrder);

    await this.executionService.dispatchOrder(
      squareOffOrder,
      exitPrice,
      marketStatus
    );

    const [updatedPosition, todayTrades] = await Promise.all([
      this.positionRepo.findById(position.id),
      this.tradeRepo.findByUserId(dto.userId, {
        from: MarketHoursService.getStartOfTodayIst(),
        symbol: position.symbol,
        productType: position.productType,
      }),
    ]);

    const evaluated = PositionsValuationCalculator.evaluateSinglePosition(
      updatedPosition ?? position,
      todayTrades,
      exitPrice
    );

    return PositionDTOMapper.toItemDTO(evaluated);
  }
}
