import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { OrderExecutionService } from "../../services/trading/OrderExecutionService";
import { Order, OrderSide, OrderType, OrderStatus } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { SquareOffPositionRequestDTO, PositionResponseDTO } from "../../dto/trading/PositionDTOs";
import { ISquareOffPositionUseCase } from "../../interface/use-cases/trading/ISquareOffPositionUseCase";
import { IIdGenerator } from "../../interface/services/IIdGenerator";
import { env } from "../../../infrastructure/config/env";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class SquareOffPositionUseCase implements ISquareOffPositionUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly marketDataService: IMarketDataService,
    private readonly executionService: OrderExecutionService,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: SquareOffPositionRequestDTO): Promise<PositionResponseDTO> {
    const position = await this.positionRepo.findById(dto.positionId);
    if (!position || position.userId !== dto.userId) {
      throw new AppError(ErrorCodes.POSITION_NOT_FOUND, "Position not found");
    }

    if (!position.isOpen()) {
      throw new AppError(ErrorCodes.POSITION_ALREADY_CLOSED, "Position is already closed");
    }

    const marketStatus = MarketHoursService.getMarketStatus(env.ENFORCE_MARKET_HOURS);
    const isAmo = env.ENFORCE_MARKET_HOURS ? !marketStatus.isOpen : false;

    const opposingSide =
      position.side === PositionSide.LONG ? OrderSide.SELL : OrderSide.BUY;

    const quote = await this.marketDataService.getQuote(position.symbol);
    let exitPrice: number;

    if (opposingSide === OrderSide.SELL) {
      exitPrice = quote?.bidPrice && quote.bidPrice > 0 ? quote.bidPrice : quote?.ltp ?? position.averagePrice;
    } else {
      exitPrice = quote?.askPrice && quote.askPrice > 0 ? quote.askPrice : quote?.ltp ?? position.averagePrice;
    }

    if (exitPrice <= 0) {
      exitPrice = position.averagePrice;
    }

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

    const updatedPosition = await this.positionRepo.findById(position.id);
    const finalPosition = updatedPosition ?? position;

    const todayTrades = await this.tradeRepo.findByUserId(dto.userId, {
      from: MarketHoursService.getStartOfTodayIst(),
      symbol: finalPosition.symbol,
      productType: finalPosition.productType,
    });
    const realizedPnL = +todayTrades
      .reduce((sum, trade) => sum + trade.realizedPnL, 0)
      .toFixed(2);
    const unrealizedPnL = finalPosition.calculateUnrealizedPnL(exitPrice);

    return {
      id: finalPosition.id,
      userId: finalPosition.userId,
      stockId: finalPosition.stockId,
      symbol: finalPosition.symbol,
      productType: finalPosition.productType,
      side: finalPosition.side,
      quantity: finalPosition.quantity,
      buyQty: finalPosition.buyQty,
      buyAmount: finalPosition.buyAmount,
      sellQty: finalPosition.sellQty,
      sellAmount: finalPosition.sellAmount,
      averagePrice: finalPosition.averagePrice,
      currentLtp: exitPrice,
      unrealizedPnL,
      realizedPnL,
      totalPnL: +(realizedPnL + unrealizedPnL).toFixed(2),
      pnlPercentage: 0,
      blockedMargin: finalPosition.blockedMargin,
      createdAt: finalPosition.createdAt,
      updatedAt: finalPosition.updatedAt,
    };
  }
}
