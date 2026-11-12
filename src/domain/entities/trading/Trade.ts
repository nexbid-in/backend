import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { OrderSide, ProductType } from "./Order";

export interface TradeProps {
  id: string;
  orderId: string;
  userId: string;
  stockId: string;
  symbol: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: number;
  tradeValue: number;
  realizedPnL?: number;
  executedAt?: Date;
}

export class Trade {
  private constructor(
    private readonly props: {
      id: string;
      orderId: string;
      userId: string;
      stockId: string;
      symbol: string;
      side: OrderSide;
      productType: ProductType;
      quantity: number;
      price: number;
      tradeValue: number;
      realizedPnL: number;
      executedAt: Date;
    }
  ) {}

  static create(props: TradeProps): Trade {
    if (!props.id || !props.orderId || !props.userId || !props.stockId || !props.symbol) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }
    if (props.quantity <= 0 || !Number.isInteger(props.quantity)) {
      throw new AppError(ErrorCodes.INVALID_ORDER_QUANTITY);
    }
    if (props.price <= 0) {
      throw new AppError(ErrorCodes.INVALID_ORDER_PRICE);
    }

    return new Trade({
      id: props.id,
      orderId: props.orderId,
      userId: props.userId,
      stockId: props.stockId,
      symbol: props.symbol.toUpperCase().trim(),
      side: props.side,
      productType: props.productType,
      quantity: props.quantity,
      price: props.price,
      tradeValue: props.tradeValue,
      realizedPnL: props.realizedPnL ?? 0,
      executedAt: props.executedAt ?? new Date(),
    });
  }

  get id(): string { return this.props.id; }
  get orderId(): string { return this.props.orderId; }
  get userId(): string { return this.props.userId; }
  get stockId(): string { return this.props.stockId; }
  get symbol(): string { return this.props.symbol; }
  get side(): OrderSide { return this.props.side; }
  get productType(): ProductType { return this.props.productType; }
  get quantity(): number { return this.props.quantity; }
  get price(): number { return this.props.price; }
  get tradeValue(): number { return this.props.tradeValue; }
  get realizedPnL(): number { return this.props.realizedPnL; }
  get executedAt(): Date { return this.props.executedAt; }
}

