import crypto from "crypto";
import { Order } from "../../../domain/entities/trading/Order";
import { Trade } from "../../../domain/entities/trading/Trade";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { TradeChargesCalculator } from "../../../domain/services/trading/TradeChargesCalculator";
import { Money } from "../../../domain/value-objects/Money";
import { ILogger } from "../../interface/services/ILogger";
import { OrderWalletSettlementService } from "./OrderWalletSettlementService";
import { PositionFillService } from "./PositionFillService";

/**
 * Coordinates atomic-sequence execution of a matched order: marking the order filled,
 * updating positions, recording the trade & charges, and settling the wallet ledger.
 */
export class OrderTradeExecutionService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly positionFillService: PositionFillService,
    private readonly walletSettlementService: OrderWalletSettlementService,
    private readonly logger: ILogger
  ) {}

  async executeOrder(order: Order, fillPrice: number): Promise<Order> {
    if (!order.isPending()) {
      return order;
    }

    this.logger.info(
      { orderId: order.id, symbol: order.symbol, side: order.side, fillPrice },
      "Executing matched order"
    );

    order.markExecuted(fillPrice, order.quantity);
    await this.orderRepo.update(order);

    const fillOutcome = await this.positionFillService.applyOrderFill(
      order,
      fillPrice
    );

    const fillPriceMoney = Money.of(fillPrice);
    const tradeValueMoney = fillPriceMoney.multiply(order.quantity);
    const incrementalPnLMoney = Money.of(fillOutcome.incrementalPnL);

    const charges = TradeChargesCalculator.calculate(
      order.side,
      order.productType,
      order.quantity,
      fillPriceMoney
    );

    const trade = Trade.create({
      id: crypto.randomUUID(),
      orderId: order.id,
      userId: order.userId,
      stockId: order.stockId,
      symbol: order.symbol,
      side: order.side,
      productType: order.productType,
      quantity: order.quantity,
      price: fillPriceMoney,
      tradeValue: tradeValueMoney,
      realizedPnL: incrementalPnLMoney,
      charges,
      executedAt: order.updatedAt,
    });
    await this.tradeRepo.save(trade);

    await this.walletSettlementService.settleExecutedOrder({
      order,
      fillPriceMoney,
      tradeValueMoney,
      incrementalPnLMoney,
      chargesTotal: charges.total,
      isClosingPosition: fillOutcome.isClosingPosition,
      prevAvgPrice: fillOutcome.prevAvgPrice,
      closedQty: fillOutcome.closedQty,
    });

    return order;
  }
}
