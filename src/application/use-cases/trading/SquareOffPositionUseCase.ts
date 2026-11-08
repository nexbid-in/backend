import crypto from "crypto";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { OrderMatchingEngine } from "../../../infrastructure/external/trading/OrderMatchingEngine";
import { Order, OrderSide, OrderType, OrderStatus } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { SquareOffPositionRequestDTO, PositionResponseDTO } from "../../dto/trading/PositionDTOs";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class SquareOffPositionUseCase {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly marketDataService: IMarketDataService,
    private readonly matchingEngine: OrderMatchingEngine
  ) {}

  async execute(dto: SquareOffPositionRequestDTO): Promise<PositionResponseDTO> {
    const position = await this.positionRepo.findById(dto.positionId);
    if (!position || position.userId !== dto.userId) {
      throw new AppError(ErrorCodes.POSITION_NOT_FOUND, "Position not found");
    }

    if (!position.isOpen()) {
      throw new AppError(ErrorCodes.POSITION_ALREADY_CLOSED, "Position is already closed");
    }

    // 1. Determine opposing order side to flatten the position
    const opposingSide =
      position.side === PositionSide.LONG ? OrderSide.SELL : OrderSide.BUY;

    // 2. Fetch current exit price
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

    // 3. Create synthetic MARKET square-off order
    let squareOffOrder = Order.create({
      id: crypto.randomUUID(),
      userId: dto.userId,
      stockId: position.stockId,
      symbol: position.symbol,
      side: opposingSide,
      orderType: OrderType.MARKET,
      productType: position.productType,
      status: OrderStatus.PENDING,
      quantity: position.quantity,
      blockedMargin: 0,
    });

    squareOffOrder = await this.orderRepo.save(squareOffOrder);

    // 4. Execute through matching engine to apply fill and settle wallet
    await this.matchingEngine.executeOrder(squareOffOrder, exitPrice);

    // 5. Fetch updated position state
    const updatedPosition = await this.positionRepo.findById(position.id);
    const finalPosition = updatedPosition ?? position;

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
      unrealizedPnL: finalPosition.calculateUnrealizedPnL(exitPrice),
      realizedPnL: finalPosition.realizedPnL,
      totalPnL: finalPosition.calculateTotalPnL(exitPrice),
      pnlPercentage: 0,
      blockedMargin: finalPosition.blockedMargin,
      createdAt: finalPosition.createdAt,
      updatedAt: finalPosition.updatedAt,
    };
  }
}

