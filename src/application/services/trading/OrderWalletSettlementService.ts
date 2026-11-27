import crypto from "crypto";
import {
  Order,
  OrderSide,
  ProductType,
} from "../../../domain/entities/trading/Order";
import { Wallet } from "../../../domain/entities/Wallet";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { Money } from "../../../domain/value-objects/Money";
import { MarginCalculatorService } from "./MarginCalculatorService";

export interface ExecutedOrderSettlementContext {
  order: Order;
  fillPriceMoney: Money;
  tradeValueMoney: Money;
  incrementalPnLMoney: Money;
  chargesTotal: Money;
  isClosingPosition: boolean;
  prevAvgPrice: number;
  closedQty: number;
}

type ProductSettlementHandler = (
  wallet: Wallet,
  context: ExecutedOrderSettlementContext
) => Promise<void>;

/**
 * Settles cash, blocked margin, realized P&L, and transaction charges against user wallets
 * using product-type settlement strategies.
 */
export class OrderWalletSettlementService {
  private readonly settlementHandlers: Record<ProductType, ProductSettlementHandler>;

  constructor(
    private readonly walletRepo: IWalletRepository,
    private readonly marginCalculator: MarginCalculatorService
  ) {
    this.settlementHandlers = {
      [ProductType.CNC]: (wallet, context) => this.settleCncOrder(wallet, context),
      [ProductType.MIS]: (wallet, context) =>
        this.settleLeveragedIntradayOrder(wallet, context),
    };
  }

  async settleExecutedOrder(
    context: ExecutedOrderSettlementContext
  ): Promise<void> {
    const wallet = await this.walletRepo.findOrCreateByUserId(
      context.order.userId
    );
    const settle = this.settlementHandlers[context.order.productType];
    await settle(wallet, context);
  }

  private async settleCncOrder(
    wallet: Wallet,
    context: ExecutedOrderSettlementContext
  ): Promise<void> {
    const { order, fillPriceMoney, tradeValueMoney, chargesTotal } = context;

    if (order.side === OrderSide.BUY) {
      const totalCost = tradeValueMoney.add(chargesTotal);
      wallet.debitTradeCost(totalCost);

      const tx = WalletTransaction.create({
        id: crypto.randomUUID(),
        walletId: wallet.id,
        userId: wallet.userId,
        referenceId: order.id,
        type: "BUY",
        amount: totalCost.multiply(-1),
        balanceAfter: wallet.balance,
        description: `CNC Buy ${order.quantity} shares of ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${chargesTotal.toString()})`,
      });
      await this.walletRepo.saveWithTransaction(wallet, tx);
      return;
    }

    const netProceeds = tradeValueMoney.subtract(chargesTotal);
    wallet.creditTradeProceeds(netProceeds);

    const tx = WalletTransaction.create({
      id: crypto.randomUUID(),
      walletId: wallet.id,
      userId: wallet.userId,
      referenceId: order.id,
      type: "SELL",
      amount: netProceeds,
      balanceAfter: wallet.balance,
      description: `CNC Sell ${order.quantity} shares of ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${chargesTotal.toString()})`,
    });
    await this.walletRepo.saveWithTransaction(wallet, tx);
  }

  private async settleLeveragedIntradayOrder(
    wallet: Wallet,
    context: ExecutedOrderSettlementContext
  ): Promise<void> {
    const {
      order,
      fillPriceMoney,
      incrementalPnLMoney,
      chargesTotal,
      isClosingPosition,
      prevAvgPrice,
      closedQty,
    } = context;

    if (isClosingPosition && closedQty > 0) {
      const marginReleased = this.marginCalculator.calculateRequiredMarginMoney(
        order.productType,
        closedQty,
        Money.of(prevAvgPrice)
      );
      const netRealizedPnL = incrementalPnLMoney.subtract(chargesTotal);

      wallet.settlePosition(marginReleased, netRealizedPnL);

      const tx = WalletTransaction.create({
        id: crypto.randomUUID(),
        walletId: wallet.id,
        userId: wallet.userId,
        referenceId: order.id,
        type: order.side === OrderSide.BUY ? "BUY" : "SELL",
        amount: netRealizedPnL,
        balanceAfter: wallet.balance,
        description: `${order.productType} Square-off ${closedQty} ${order.symbol} @ ₹${fillPriceMoney.toString()} (Net Realized P&L: ₹${
          netRealizedPnL.isGreaterThanOrEqual(Money.zero()) ? "+" : ""
        }${netRealizedPnL.toString()}, Charges: ₹${chargesTotal.toString()})`,
      });
      await this.walletRepo.saveWithTransaction(wallet, tx);
      return;
    }

    await this.reconcileOpeningBlockedMargin(wallet, order, fillPriceMoney);
    await this.debitIntradayCharges(wallet, order, fillPriceMoney, chargesTotal);
  }

  private async reconcileOpeningBlockedMargin(
    wallet: Wallet,
    order: Order,
    fillPriceMoney: Money
  ): Promise<void> {
    const actualRequiredMargin = this.marginCalculator.calculateRequiredMarginMoney(
      order.productType,
      order.quantity,
      fillPriceMoney
    );
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
  }

  private async debitIntradayCharges(
    wallet: Wallet,
    order: Order,
    fillPriceMoney: Money,
    chargesTotal: Money
  ): Promise<void> {
    if (!chargesTotal.isPositive() || !wallet.canDebit(chargesTotal)) {
      return;
    }

    wallet.debitTradeCost(chargesTotal);
    const feeTx = WalletTransaction.create({
      id: crypto.randomUUID(),
      walletId: wallet.id,
      userId: wallet.userId,
      referenceId: `${order.id}-CHG`,
      type: order.side === OrderSide.BUY ? "BUY" : "SELL",
      amount: chargesTotal.multiply(-1),
      balanceAfter: wallet.balance,
      description: `${order.productType} Trade Charges for ${order.quantity} ${order.symbol} @ ₹${fillPriceMoney.toString()} (Charges: ₹${chargesTotal.toString()})`,
    });
    await this.walletRepo.saveWithTransaction(wallet, feeTx);
  }
}
