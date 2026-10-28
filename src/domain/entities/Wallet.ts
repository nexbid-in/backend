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

  // --- Getters ---
  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get balance(): number { return this.props.balance; }
  get usedMargin(): number { return this.props.usedMargin; }
  get totalVirtualBought(): number { return this.props.totalVirtualBought; }
  get totalRealSpent(): number { return this.props.totalRealSpent; }
  get status(): WalletStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- Domain Business Logic & Invariants ---

  public isActive(): boolean {
    return this.props.status === "ACTIVE";
  }

  public canDebit(amount: number): boolean {
    return this.isActive() && amount > 0 && this.props.balance >= amount;
  }

  // ==========================================
  // 1. TOP-UP (Real Money Deposit)
  // ==========================================
  // Called ONLY when the user buys virtual money via payment gateway
  public topUp(virtualAmount: number, realAmount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (virtualAmount <= 0 || realAmount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += virtualAmount;
    this.props.totalVirtualBought += virtualAmount;
    this.props.totalRealSpent += realAmount;
    this.props.updatedAt = new Date();
  }

  // ==========================================
  // 2. TRADING CREDITS & DEBITS (Stock Buy/Sell)
  // ==========================================

  // Called when stock is sold (crediting sale proceeds or realized profit)
  public creditTradeProceeds(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  // Called when stock is bought (CNC / delivery full debit)
  public debitTradeCost(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);
    if (this.props.balance < amount) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.balance -= amount;
    this.props.updatedAt = new Date();
  }

  // ==========================================
  // 3. MARGIN MANAGEMENT (Pending Orders & Intraday)
  // ==========================================

  // Block margin when user places a limit order or opens an intraday position
  public blockMargin(amount: number): void {
    if (!this.canDebit(amount)) throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);

    this.props.balance -= amount;
    this.props.usedMargin += amount;
    this.props.updatedAt = new Date();
  }

  // Release margin when user cancels a pending order
  public releaseMargin(amount: number): void {
    if (amount <= 0 || this.props.usedMargin < amount) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }

    this.props.usedMargin -= amount;
    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  // Settle an open position (squaring off an intraday trade)
  public settlePosition(blockedMargin: number, netPayout: number): void {
    if (blockedMargin <= 0 || this.props.usedMargin < blockedMargin) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }

    this.props.usedMargin -= blockedMargin;
    this.props.balance += netPayout;
    this.props.updatedAt = new Date();
  }

  // ==========================================
  // 4. BONUSES & PROMOTIONS
  // ==========================================

  // Credit welcome bonus, referral reward, or promotional virtual money
  public creditBonus(amount: number): void {
    if (!this.isActive()) throw new AppError(ErrorCodes.WALLET_FROZEN);
    if (amount <= 0) throw new AppError(ErrorCodes.INVALID_AMOUNT);

    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  // ==========================================
  // 5. STATUS TRANSITIONS (Admin / System / Kill Switch)
  // ==========================================

  // Admin or System freezes the wallet 
  public freeze(): void {
    this.props.status = "FROZEN";
    this.props.updatedAt = new Date();
  }

  // Admin reactivates the wallet after review
  public unfreeze(): void {
    this.props.status = "ACTIVE";
    this.props.updatedAt = new Date();
  }

  // User or System (Risk/Margin limit breach) suspends trading
  public suspend(): void {
    this.props.status = "SUSPENDED";
    this.props.updatedAt = new Date();
  }
}

