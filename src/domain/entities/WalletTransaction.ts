import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type WalletTransactionType = "TOPUP" | "BUY" | "SELL" | "BONUS";

export interface WalletTransactionProps {
  id: string;
  walletId: string;
  userId: string;
  referenceId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export class WalletTransaction {
  private constructor(private readonly props: {
    id: string;
    walletId: string;
    userId: string;
    referenceId: string;
    type: WalletTransactionType;
    amount: number;
    balanceAfter: number;
    description: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }) {}

  static create(props: WalletTransactionProps): WalletTransaction {
    if (!props.id || !props.walletId || !props.userId || !props.referenceId) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    return new WalletTransaction({
      id: props.id,
      walletId: props.walletId,
      userId: props.userId,
      referenceId: props.referenceId,
      type: props.type,
      amount: props.amount,
      balanceAfter: props.balanceAfter,
      description: props.description,
      metadata: props.metadata ?? null,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  // Getters only — financial ledger records are immutable
  get id(): string { return this.props.id; }
  get walletId(): string { return this.props.walletId; }
  get userId(): string { return this.props.userId; }
  get referenceId(): string { return this.props.referenceId; }
  get type(): WalletTransactionType { return this.props.type; }
  get amount(): number { return this.props.amount; }
  get balanceAfter(): number { return this.props.balanceAfter; }
  get description(): string { return this.props.description; }
  get metadata(): Record<string, unknown> | null { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
}
