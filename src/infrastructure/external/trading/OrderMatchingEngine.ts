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
  // In-memory limit order book: Clean Symbol -> Pending Order[]
  private orderBook = new Map<string, Order[]>();
  // Active execution guard per order to prevent double-fills
  private executingOrderIds = new Set<string>();

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  public async start(): Promise<void> {
    try {
      // 1. Hydrate in-memory order book from database on startup
      const pendingOrders = await this.orderRepo.findPendingOrders();
      const symbolsToSubscribe = new Set<string>();

      for (const order of pendingOrders) {
        this.addOrderToBook(order);
        symbolsToSubscribe.add(order.symbol);
      }

      logger.info(
        { pendingCount: pendingOrders.length, symbols: Array.from(symbolsToSubscribe) },
        "Virtual Order Matching Engine hydrated in-memory order book from database"
      );

      // 2. Ensure broker feed is actively streaming ticks for all pending symbols
      if (symbolsToSubscribe.size > 0) {
        await this.marketDataService.subscribe(Array.from(symbolsToSubscribe));
      }
    } catch (err) {
      logger.error({ err }, "Failed to hydrate order book on matching engine startup");
    }

    // 3. Register real-time market tick listener
    this.marketDataService.onTick(this.processTick.bind(this));
    logger.info("Virtual Order Matching Engine started and listening to market ticks");
  }

  public addOrderToBook(order: Order): void {
    const sym = order.symbol.toUpperCase().trim();
    const existing = this.orderBook.get(sym) ?? [];
    if (!existing.some((o) => o.id === order.id)) {
      existing.push(order);
      this.orderBook.set(sym, existing);
      logger.info(
        { orderId: order.id, symbol: sym, price: order.price, side: order.side },
        "Added pending order to in-memory limit order book"
      );
    }
  }

  public removeOrderFromBook(orderId: string, symbol: string): void {
    const sym = symbol.toUpperCase().trim();
    const existing = this.orderBook.get(sym);
    if (!existing) return;

    const filtered = existing.filter((o) => o.id !== orderId);
    if (filtered.length > 0) {
      this.orderBook.set(sym, filtered);
    } else {
      this.orderBook.delete(sym);
    }
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

    // Remove immediately from in-memory limit order book
    this.removeOrderFromBook(order.id, order.symbol);

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
   * Processes live incoming ticks to match pending limit orders in microsecond in-memory lookups.
   * Eliminates database polling per tick and prevents tick dropping race conditions.
   */
  public async processTick(tick: MarketTick): Promise<void> {
    const sym = tick.symbol.toUpperCase().trim();
    const orders = this.orderBook.get(sym);
    if (!orders || orders.length === 0) return; // 0ms instantaneous exit!

    for (const order of [...orders]) {
      if (!order.isPending() || !order.price) continue;
      if (this.executingOrderIds.has(order.id)) continue;

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
        this.executingOrderIds.add(order.id);
        // Remove from book immediately so another tick does not re-trigger it
        this.removeOrderFromBook(order.id, sym);

        try {
          logger.info(
            { orderId: order.id, symbol: sym, side: order.side, limitPrice: order.price, tickLtp: tick.ltp, executionPrice },
            "Limit order condition satisfied! Executing trade"
          );
          await this.executeOrder(order, executionPrice);
        } catch (execErr) {
          logger.error({ execErr, orderId: order.id, symbol: sym }, "Failed to execute matched limit order");
          // Re-insert order if execution failed
          this.addOrderToBook(order);
        } finally {
          this.executingOrderIds.delete(order.id);
        }
      }
    }
  }
}

