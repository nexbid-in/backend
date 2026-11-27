import crypto from "crypto";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IMarketStreamService } from "../../../application/interface/services/IMarketDataService";
import { IOrderMatchingEngine } from "../../../application/interface/services/IOrderMatchingEngine";
import { MarketHoursService } from "../../../application/services/trading/MarketHoursService";
import { Order, OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Position, PositionSide } from "../../../domain/entities/trading/Position";
import { Trade } from "../../../domain/entities/trading/Trade";
import { TradeChargesCalculator } from "../../../domain/services/trading/TradeChargesCalculator";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { Money } from "../../../domain/value-objects/Money";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { logger } from "../../logging/logger";

export class OrderMatchingEngine implements IOrderMatchingEngine {
  private orderBook = new Map<string, Order[]>();
  private executingOrderIds = new Set<string>();

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly tradeRepo: ITradeRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly marketStream: IMarketStreamService
  ) {}

  public async start(): Promise<void> {
    try {
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

      if (symbolsToSubscribe.size > 0) {
        await this.marketStream.subscribe(Array.from(symbolsToSubscribe));
      }
    } catch (err) {
      logger.error({ err }, "Failed to hydrate order book on matching engine startup");
    }

    this.marketStream.onTick((tick) => {
      void this.processTick(tick);
    });
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

  public async executeOrder(order: Order, fillPrice: number): Promise<Order> {
    if (!order.isPending()) return order;

    logger.info(
      { orderId: order.id, symbol: order.symbol, side: order.side, fillPrice },
      "Executing order in matching engine"
    );

    order.markExecuted(fillPrice, order.quantity);
    await this.orderRepo.update(order);
    this.removeOrderFromBook(order.id, order.symbol);

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
    } else if (!position.isOpen() && position.updatedAt < MarketHoursService.getStartOfTodayIst()) {
      position.resetSessionCounters();
    }

    const isClosingPosition =
      (position.side === PositionSide.LONG && order.side === OrderSide.SELL) ||
      (position.side === PositionSide.SHORT && order.side === OrderSide.BUY);

    const prevAvgPrice = position.averagePrice;
    const closedQty = isClosingPosition ? Math.min(position.quantity, order.quantity) : 0;
    const incrementalPnL = position.applyFill(order.side, order.quantity, fillPrice);

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

    const fillPriceMoney = Money.of(fillPrice);
    const tradeValueMoney = fillPriceMoney.multiply(order.quantity);
    const incrementalPnLMoney = Money.of(incrementalPnL);

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

    const wallet = await this.walletRepo.findOrCreateByUserId(order.userId);

    if (order.productType === ProductType.CNC) {
      if (order.side === OrderSide.BUY) {
        const totalCost = tradeValueMoney.add(charges.total);
        wallet.debitTradeCost(totalCost);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: order.id,
          type: "BUY",
          amount: totalCost.multiply(-1),
          balanceAfter: wallet.balance,
          description: `CNC Buy ${order.quantity} shares of ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${charges.total.toString()})`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      } else {
        const netProceeds = tradeValueMoney.subtract(charges.total);
        wallet.creditTradeProceeds(netProceeds);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: order.id,
          type: "SELL",
          amount: netProceeds,
          balanceAfter: wallet.balance,
          description: `CNC Sell ${order.quantity} shares of ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${charges.total.toString()})`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      }
    } else if (order.productType === ProductType.MIS) {
      if (isClosingPosition && closedQty > 0) {
        const marginReleased = Money.of(prevAvgPrice).multiply(closedQty).divide(5);
        const netRealizedPnL = incrementalPnLMoney.subtract(charges.total);

        wallet.settlePosition(marginReleased, netRealizedPnL);

        const tx = WalletTransaction.create({
          id: crypto.randomUUID(),
          walletId: wallet.id,
          userId: wallet.userId,
          referenceId: order.id,
          type: order.side === OrderSide.BUY ? "BUY" : "SELL",
          amount: netRealizedPnL,
          balanceAfter: wallet.balance,
          description: `MIS Square-off ${closedQty} ${order.symbol} @ ₹${fillPriceMoney.toString()} (Net Realized P&L: ₹${
            netRealizedPnL.isGreaterThanOrEqual(Money.zero()) ? "+" : ""
          }${netRealizedPnL.toString()}, Charges: ₹${charges.total.toString()})`,
        });
        await this.walletRepo.saveWithTransaction(wallet, tx);
      } else {
        const actualRequiredMargin = fillPriceMoney.multiply(order.quantity).divide(5);
        const blockedMarginMoney = Money.of(order.blockedMargin);
        const diff = blockedMarginMoney.subtract(actualRequiredMargin);

        if (diff.isPositive()) {
          wallet.releaseMargin(diff);
          await this.walletRepo.update(wallet);
        } else if (diff.isNegative()) {
          const extra = diff.multiply(-1);
          if (wallet.canDebit(extra)) {
            wallet.blockMargin(extra);
            await this.walletRepo.update(wallet);
          }
        }

        if (charges.total.isPositive() && wallet.canDebit(charges.total)) {
          wallet.debitTradeCost(charges.total);
          const feeTx = WalletTransaction.create({
            id: crypto.randomUUID(),
            walletId: wallet.id,
            userId: wallet.userId,
            referenceId: `${order.id}-CHG`,
            type: order.side === OrderSide.BUY ? "BUY" : "SELL",
            amount: charges.total.multiply(-1),
            balanceAfter: wallet.balance,
            description: `MIS Trade Charges for ${order.quantity} ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${charges.total.toString()})`,
          });
          await this.walletRepo.saveWithTransaction(wallet, feeTx);
        }
      }
    }

    return order;
  }

  public async processTick(tick: MarketTick): Promise<void> {
    const sym = tick.symbol.toUpperCase().trim();
    const orders = this.orderBook.get(sym);
    if (!orders || orders.length === 0) return;

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
        this.removeOrderFromBook(order.id, sym);

        try {
          logger.info(
            { orderId: order.id, symbol: sym, side: order.side, limitPrice: order.price, tickLtp: tick.ltp, executionPrice },
            "Limit order condition satisfied! Executing trade"
          );
          await this.executeOrder(order, executionPrice);
        } catch (execErr) {
          logger.error({ execErr, orderId: order.id, symbol: sym }, "Failed to execute matched limit order");
          this.addOrderToBook(order);
        } finally {
          this.executingOrderIds.delete(order.id);
        }
      }
    }
  }
}

