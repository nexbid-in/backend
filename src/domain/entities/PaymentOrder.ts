import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentOrderProps {
  id: string;
  userId: string;
  orderId: string;       
  paymentId?: string | null; 
  realAmount: number;    
  virtualAmount: number; 
  status?: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentOrder {
  private constructor(private readonly props: {
    id: string;
    userId: string;
    orderId: string;
    paymentId: string | null;
    realAmount: number;
    virtualAmount: number;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {}

  static create(props: PaymentOrderProps): PaymentOrder {
    if (!props.id || !props.userId || !props.orderId) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }
    if (props.realAmount <= 0 || props.virtualAmount <= 0) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }

    return new PaymentOrder({
      id: props.id,
      userId: props.userId,
      orderId: props.orderId,
      paymentId: props.paymentId ?? null,
      realAmount: props.realAmount,
      virtualAmount: props.virtualAmount,
      status: props.status ?? "PENDING",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  // Getters
  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get orderId(): string { return this.props.orderId; }
  get paymentId(): string | null { return this.props.paymentId; }
  get realAmount(): number { return this.props.realAmount; }
  get virtualAmount(): number { return this.props.virtualAmount; }
  get status(): PaymentStatus { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // State Transitions
  public markAsSuccess(paymentId: string): void {
    if (this.props.status === "SUCCESS") {
      throw new AppError(ErrorCodes.VALIDATION_FAILED); 
    }
    this.props.status = "SUCCESS";
    this.props.paymentId = paymentId;
    this.props.updatedAt = new Date();
  }

  public markAsFailed(): void {
    this.props.status = "FAILED";
    this.props.updatedAt = new Date();
  }
}
