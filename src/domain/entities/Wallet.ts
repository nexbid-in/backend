import { Money, MoneyInput } from "../value-objects/Money";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED";

export interface WalletProps {
  id: string;
  userId: string;
  balance: MoneyInput;
  usedMargin: MoneyInput;
  totalVirtualBought: MoneyInput;
  totalRealSpent: MoneyInput;
  status?: WalletStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wallet {
  private constructor(private readonly props: {
    id: string;
    userId: string;
    balance: Money;
    usedMargin: Money;
    totalVirtualBought: Money;
    totalRealSpent: Money;
    status: WalletStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {}

  static create(props: WalletProps): Wallet {
    if (!props.id || !props.userId) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    return new Wallet({
      id: props.id,
      userId: props.userId,
      balance: Money.of(props.balance ?? 0),
      usedMargin: Money.of(props.usedMargin ?? 0),
      totalVirtualBought: Money.of(props.totalVirtualBought ?? 0),
      totalRealSpent: Money.of(props.totalRealSpent ?? 0),
      status: props.status ?? "ACTIVE",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get balance(): Money { return this.props.balance; }
  get usedMargin(): Money { return this.props.usedMargin; }
  get totalVirtualBought(): Money { return this.props.totalVirtualBought; }
  get totalRealSpent(): Money { return this.props.totalRealSpent; }
  get status(): WalletStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get availableMargin(): Money {
    if (this.props.balance.isGreaterThanOrEqual(this.props.usedMargin)) {
      return this.props.balance.subtract(this.props.usedMargin);
    }
    return Money.zero();
  }

  public isActive(): boolean {
    return this.props.status === "ACTIVE";
  }

  public canDebit(amount: MoneyInput): boolean {
    const amt = Money.of(amount);
    return this.isActive() && amt.isPositive() && this.availableMargin.isGreaterThanOrEqual(amt);
  }

  public topUp(virtualAmount: MoneyInput, realAmount: MoneyInput): void {
    const vAmt = Money.of(virtualAmount);
    const rAmt = Money.of(realAmount);

    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (!vAmt.isPositive() || !rAmt.isPositive()) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance = this.props.balance.add(vAmt);
    this.props.totalVirtualBought = this.props.totalVirtualBought.add(vAmt);
    this.props.totalRealSpent = this.props.totalRealSpent.add(rAmt);
    this.props.updatedAt = new Date();
  }

  public creditTradeProceeds(amount: MoneyInput): void {
    const amt = Money.of(amount);
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (!amt.isPositive()) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance = this.props.balance.add(amt);
    this.props.updatedAt = new Date();
  }

  public debitTradeCost(amount: MoneyInput): void {
    const amt = Money.of(amount);
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (!amt.isPositive()) throw new AppError(ErrorCodes.INVALID_AMOUNT);
    if (this.availableMargin.isLessThan(amt)) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.balance = this.props.balance.subtract(amt);
    this.props.updatedAt = new Date();
  }

  public blockMargin(amount: MoneyInput): void {
    const amt = Money.of(amount);
    if (!this.canDebit(amt)) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.usedMargin = this.props.usedMargin.add(amt);
    this.props.updatedAt = new Date();
  }

  public releaseMargin(amount: MoneyInput): void {
    const amt = Money.of(amount);
    if (!amt.isPositive()) {
      return;
    }

    const unblock = this.props.usedMargin.isLessThan(amt) ? this.props.usedMargin : amt;
    this.props.usedMargin = this.props.usedMargin.subtract(unblock);
    this.props.updatedAt = new Date();
  }

  public settlePosition(blockedMargin: MoneyInput, realizedPnL: MoneyInput): void {
    const margin = Money.of(blockedMargin);
    const pnl = Money.of(realizedPnL);

    if (margin.isPositive()) {
      const unblock = this.props.usedMargin.isLessThan(margin) ? this.props.usedMargin : margin;
      this.props.usedMargin = this.props.usedMargin.subtract(unblock);
    }

    this.props.balance = this.props.balance.add(pnl);
    this.props.updatedAt = new Date();
  }

  public creditBonus(amount: MoneyInput): void {
    const amt = Money.of(amount);
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (!amt.isPositive()) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance = this.props.balance.add(amt);
    this.props.updatedAt = new Date();
  }

  public freeze(): void {
    this.props.status = "FROZEN";
    this.props.updatedAt = new Date();
  }

  public unfreeze(): void {
    this.props.status = "ACTIVE";
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    this.props.status = "SUSPENDED";
    this.props.updatedAt = new Date();
  }
}
