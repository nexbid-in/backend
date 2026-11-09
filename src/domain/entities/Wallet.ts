import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED";

export interface WalletProps {
  id: string;
  userId: string;
  balance: number;
  usedMargin: number;
  totalVirtualBought: number;
  totalRealSpent: number;
  status?: WalletStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wallet {
  private constructor(private readonly props: {
    id: string;
    userId: string;
    balance: number;
    usedMargin: number;
    totalVirtualBought: number;
    totalRealSpent: number;
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
      balance: props.balance ?? 0,
      usedMargin: props.usedMargin ?? 0,
      totalVirtualBought: props.totalVirtualBought ?? 0,
      totalRealSpent: props.totalRealSpent ?? 0,
      status: props.status ?? "ACTIVE",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get balance(): number { return this.props.balance; }
  get usedMargin(): number { return this.props.usedMargin; }
  get totalVirtualBought(): number { return this.props.totalVirtualBought; }
  get totalRealSpent(): number { return this.props.totalRealSpent; }
  get status(): WalletStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public isActive(): boolean {
    return this.props.status === "ACTIVE";
  }

  public canDebit(amount: number): boolean {
    return this.isActive() && amount > 0 && this.props.balance >= amount;
  }

  public topUp(virtualAmount: number, realAmount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (virtualAmount <= 0 || realAmount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += virtualAmount;
    this.props.totalVirtualBought += virtualAmount;
    this.props.totalRealSpent += realAmount;
    this.props.updatedAt = new Date();
  }

  public creditTradeProceeds(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  public debitTradeCost(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);
    if (this.props.balance < amount) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.balance -= amount;
    this.props.updatedAt = new Date();
  }

  public blockMargin(amount: number): void {
    if (!this.canDebit(amount)) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.balance -= amount;
    this.props.usedMargin += amount;
    this.props.updatedAt = new Date();
  }

  public releaseMargin(amount: number): void {
    if (amount <= 0 || this.props.usedMargin < amount) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }

    this.props.usedMargin -= amount;
    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  public settlePosition(blockedMargin: number, netPayout: number): void {
    if (blockedMargin <= 0 || this.props.usedMargin < blockedMargin) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }

    this.props.usedMargin -= blockedMargin;
    this.props.balance += netPayout;
    this.props.updatedAt = new Date();
  }

  public creditBonus(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += amount;
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

