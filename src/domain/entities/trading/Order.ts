import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export const OrderSide = {
  BUY: "BUY",
  SELL: "SELL",
} as const;
export type OrderSide = (typeof OrderSide)[keyof typeof OrderSide];

export const OrderType = {
  MARKET: "MARKET",
  LIMIT: "LIMIT",
  SL: "SL",
  SL_M: "SL_M",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const ProductType = {
  CNC: "CNC", // Delivery (100% Cash)
  MIS: "MIS", // Intraday (5x Leverage, Long & Short)
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const OrderStatus = {
  PENDING: "PENDING",
  EXECUTED: "EXECUTED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface OrderProps {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  productType: ProductType;
  status?: OrderStatus;
  quantity: number;
  filledQuantity?: number;
  price?: number | null;
  averagePrice?: number | null;
  triggerPrice?: number | null;
  rejectionReason?: string | null;
  blockedMargin?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  private constructor(
    private readonly props: {
      id: string;
      userId: string;
      stockId: string;
      symbol: string;
      side: OrderSide;
      orderType: OrderType;
      productType: ProductType;
      status: OrderStatus;
      quantity: number;
      filledQuantity: number;
      price: number | null;
      averagePrice: number | null;
      triggerPrice: number | null;
      rejectionReason: string | null;
      blockedMargin: number;
      createdAt: Date;
      updatedAt: Date;
    }
  ) {}

  static create(props: OrderProps): Order {
    if (!props.id || !props.userId || !props.stockId || !props.symbol) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }
    if (props.quantity <= 0 || !Number.isInteger(props.quantity)) {
      throw new AppError(ErrorCodes.INVALID_ORDER_QUANTITY);
    }
    if (props.orderType === OrderType.LIMIT && (!props.price || props.price <= 0)) {
      throw new AppError(ErrorCodes.INVALID_ORDER_PRICE);
    }

    return new Order({
      id: props.id,
      userId: props.userId,
      stockId: props.stockId,
      symbol: props.symbol.toUpperCase().trim(),
      side: props.side,
      orderType: props.orderType,
      productType: props.productType,
      status: props.status ?? OrderStatus.PENDING,
      quantity: props.quantity,
      filledQuantity: props.filledQuantity ?? 0,
      price: props.price ?? null,
      averagePrice: props.averagePrice ?? null,
      triggerPrice: props.triggerPrice ?? null,
      rejectionReason: props.rejectionReason ?? null,
      blockedMargin: props.blockedMargin ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  // Getters
  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get stockId(): string { return this.props.stockId; }
  get symbol(): string { return this.props.symbol; }
  get side(): OrderSide { return this.props.side; }
  get orderType(): OrderType { return this.props.orderType; }
  get productType(): ProductType { return this.props.productType; }
  get status(): OrderStatus { return this.props.status; }
  get quantity(): number { return this.props.quantity; }
  get filledQuantity(): number { return this.props.filledQuantity; }
  get price(): number | null { return this.props.price; }
  get averagePrice(): number | null { return this.props.averagePrice; }
  get triggerPrice(): number | null { return this.props.triggerPrice; }
  get rejectionReason(): string | null { return this.props.rejectionReason; }
  get blockedMargin(): number { return this.props.blockedMargin; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // State checks & transitions
  public isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  public canBeCancelled(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  public markExecuted(fillPrice: number, filledQty?: number): void {
    if (!this.isPending()) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, "Only pending orders can be executed");
    }
    this.props.status = OrderStatus.EXECUTED;
    this.props.averagePrice = fillPrice;
    this.props.filledQuantity = filledQty ?? this.props.quantity;
    this.props.updatedAt = new Date();
  }

  public markCancelled(): void {
    if (!this.canBeCancelled()) {
      throw new AppError(ErrorCodes.ORDER_CANNOT_BE_CANCELLED);
    }
    this.props.status = OrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public markRejected(reason: string): void {
    if (!this.isPending()) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, "Only pending orders can be rejected");
    }
    this.props.status = OrderStatus.REJECTED;
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();
  }
}

