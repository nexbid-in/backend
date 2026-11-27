import crypto from "crypto";
import { Order, OrderSide } from "../../../domain/entities/trading/Order";
import { Position, PositionSide } from "../../../domain/entities/trading/Position";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { MarginCalculatorService } from "./MarginCalculatorService";
import { MarketHoursService } from "./MarketHoursService";

export interface PositionFillResult {
  isClosingPosition: boolean;
  prevAvgPrice: number;
  closedQty: number;
  incrementalPnL: number;
}

/**
 * Applies an executed order fill to the user's position ledger and updates remaining blocked margin.
 */
export class PositionFillService {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly marginCalculator: MarginCalculatorService
  ) {}

  async applyOrderFill(
    order: Order,
    fillPrice: number
  ): Promise<PositionFillResult> {
    let position = await this.positionRepo.findByUserAndSymbol(
      order.userId,
      order.symbol,
      order.productType
    );

    const isNewPosition = !position;

    if (!position) {
      position = Position.create({
        id: crypto.randomUUID(),
        userId: order.userId,
        stockId: order.stockId,
        symbol: order.symbol,
        productType: order.productType,
      });
    } else if (
      !position.isOpen() &&
      position.updatedAt < MarketHoursService.getStartOfTodayIst()
    ) {
      position.resetSessionCounters();
    }

    const isClosingPosition =
      (position.side === PositionSide.LONG && order.side === OrderSide.SELL) ||
      (position.side === PositionSide.SHORT && order.side === OrderSide.BUY);

    const prevAvgPrice = position.averagePrice;
    const closedQty = isClosingPosition
      ? Math.min(position.quantity, order.quantity)
      : 0;
    const incrementalPnL = position.applyFill(
      order.side,
      order.quantity,
      fillPrice
    );

    if (this.marginCalculator.getLeverage(order.productType) > 1) {
      const remainingMargin = position.isOpen()
        ? this.marginCalculator.calculateRequiredMargin(
            order.productType,
            position.quantity,
            position.averagePrice
          )
        : 0;
      position.updateBlockedMargin(remainingMargin);
    }

    if (isNewPosition) {
      await this.positionRepo.save(position);
    } else {
      await this.positionRepo.update(position);
    }

    return {
      isClosingPosition,
      prevAvgPrice,
      closedQty,
      incrementalPnL,
    };
  }
}
