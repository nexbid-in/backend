import crypto from "crypto";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Order, OrderSide, OrderStatus, ProductType } from "../../../domain/entities/trading/Order";
import { Position, PositionSide } from "../../../domain/entities/trading/Position";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { logger } from "../../logging/logger";

export class OrderMatchingEngine {
  private isProcessing = false;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  public start(): void {
    this.marketDataService.onTick(this.processTick.bind(this));
    logger.info("Virtual Order Matching Engine started and listening to market ticks");
  }

  /**
   * Executes an order at a specific price atomically, updating positions, ledger, and wallet.
   */
  public async executeOrder(order: Order, fillPrice: number): Promise<Order> {
    if (!order.isPending()) return order;

    logger.info(
      { orderId: order.id, symbol: order.symbol, side: order.side, fillPrice },
      "Executing order in matching engine"
    );

    // 1. Mark order as executed
    order.markExecuted(fillPrice, order.quantity);
    await this.orderRepo.update(order);

    // 2. Fetch or initialize user's position
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
    }

    // Determine whether this order is reducing/closing an existing position
    const isClosingPosition =
      (position.side === PositionSide.LONG && order.side === OrderSide.SELL) ||
      (position.side === PositionSide.SHORT && order.side === OrderSide.BUY);

    const prevAvgPrice = position.averagePrice;
    const closedQty = isClosingPosition ? Math.min(position.quantity, order.quantity) : 0;

    // Apply the fill to position
    const incrementalPnL = position.applyFill(order.side, order.quantity, fillPrice);

    // Update position blocked margin
    if (order.productType === ProductType.MIS) {
      const remainingMargin = position.isOpen()
        ? +((position.quantity * position.averagePrice) / 5).toFixed(2)
        : 0;
      position.updateBlockedMargin(remainingMargin);
    }

    if (isNewPosition) {
      await this.positionRepo.save(position);
    } else {
      await this.positionRepo.update(position);
    }

    // 3. Update Wallet & Record Ledger Transaction
    const wallet = await this.walletRepo.findOrCreateByUserId(order.userId);

    if (order.productType === ProductType.CNC) {
      if (order.side === OrderSide.BUY) {
        const totalCost = +(fillPrice * order.quantity).toFixed(2);
        wallet.debitTradeCost(totalCost);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: `order_${order.id}`,
          type: "BUY",
          amount: -totalCost,
          balanceAfter: wallet.balance,
          description: `CNC Buy ${order.quantity} shares of ${order.symbol} @ ₹${fillPrice}`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      } else {
        const proceeds = +(fillPrice * order.quantity).toFixed(2);
        wallet.creditTradeProceeds(proceeds);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: `order_${order.id}`,
          type: "SELL",
          amount: proceeds,
          balanceAfter: wallet.balance,
          description: `CNC Sell ${order.quantity} shares of ${order.symbol} @ ₹${fillPrice}`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      }
    } else if (order.productType === ProductType.MIS) {
      if (isClosingPosition && closedQty > 0) {
        // Position was squared off (partially or fully)
        // Calculate margin released based on previous entry price
        const marginReleased = +((closedQty * prevAvgPrice) / 5).toFixed(2);
        const netCashImpact = +(marginReleased + incrementalPnL).toFixed(2);

        wallet.settlePosition(marginReleased, netCashImpact);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: `order_${order.id}`,
          type: "SELL",
          amount: incrementalPnL,
          balanceAfter: wallet.balance,
          description: `MIS Square-off ${closedQty} ${order.symbol} @ ₹${fillPrice} (Realized P&L: ₹${
            incrementalPnL >= 0 ? "+" : ""
          }${incrementalPnL})`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      } else {
        // Position was expanded or freshly opened
        // Blocked margin was already held at order creation
        // If fill price differed slightly, adjust used margin difference
        const actualRequiredMargin = +((order.quantity * fillPrice) / 5).toFixed(2);
        const diff = +(order.blockedMargin - actualRequiredMargin).toFixed(2);

        if (diff > 0) {
          wallet.releaseMargin(diff);
          await this.walletRepo.update(wallet);
        } else if (diff < 0) {
          const extra = Math.abs(diff);
          if (wallet.canDebit(extra)) {
            wallet.blockMargin(extra);
            await this.walletRepo.update(wallet);
          }
        }
      }
    }

    return order;
  }

  /**
   * Processes live incoming ticks to match pending limit orders.
   */
  public async processTick(tick: MarketTick): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingOrders = await this.orderRepo.findPendingOrdersBySymbol(tick.symbol);
      if (pendingOrders.length === 0) return;

      for (const order of pendingOrders) {
        if (!order.isPending() || !order.price) continue;

        let shouldExecute = false;
        let executionPrice = order.price;

        if (order.side === OrderSide.BUY && tick.ltp <= order.price) {
          shouldExecute = true;
          executionPrice = Math.min(order.price, tick.ltp);
        } else if (order.side === OrderSide.SELL && tick.ltp >= order.price) {
          shouldExecute = true;
          executionPrice = Math.max(order.price, tick.ltp);
        }

        if (shouldExecute) {
          await this.executeOrder(order, executionPrice);
        }
      }
    } catch (err) {
      logger.error({ err, symbol: tick.symbol }, "Error processing tick in OrderMatchingEngine");
    } finally {
      this.isProcessing = false;
    }
  }
}

