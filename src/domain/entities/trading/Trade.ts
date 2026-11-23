import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { OrderSide, ProductType } from "./Order";
import { TradeChargesProps, TradeCharges } from "../../value-objects/trading/TradeCharges";
import { Money, MoneyInput } from "../../value-objects/Money";

export interface TradeProps {
  id: string;
  orderId: string;
  userId: string;
  stockId: string;
  symbol: string;
  side: OrderSide;
  productType: ProductType;
  quantity: number;
  price: MoneyInput;
  tradeValue: MoneyInput;
  realizedPnL?: MoneyInput;
  charges?: TradeChargesProps | TradeCharges;
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
      price: Money;
      tradeValue: Money;
      realizedPnL: Money;
      charges: TradeCharges;
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
    const priceMoney = Money.of(props.price);
    if (!priceMoney.isPositive()) {
      throw new AppError(ErrorCodes.INVALID_ORDER_PRICE);
    }

    const tradeValueMoney = Money.of(props.tradeValue);
    const realizedPnLMoney = props.realizedPnL !== undefined ? Money.of(props.realizedPnL) : Money.zero();

    const charges = props.charges instanceof TradeCharges
      ? props.charges
      : props.charges
      ? TradeCharges.create(props.charges)
      : TradeCharges.zero();

    return new Trade({
      id: props.id,
      orderId: props.orderId,
      userId: props.userId,
      stockId: props.stockId,
      symbol: props.symbol.toUpperCase().trim(),
      side: props.side,
      productType: props.productType,
      quantity: props.quantity,
      price: priceMoney,
      tradeValue: tradeValueMoney,
      realizedPnL: realizedPnLMoney,
      charges,
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
  get price(): Money { return this.props.price; }
  get tradeValue(): Money { return this.props.tradeValue; }
  get realizedPnL(): Money { return this.props.realizedPnL; }
  get charges(): TradeCharges { return this.props.charges; }
  get brokerage(): Money { return this.props.charges.brokerage; }
  get stt(): Money { return this.props.charges.stt; }
  get exchangeTurnoverCharges(): Money { return this.props.charges.exchangeTurnoverCharges; }
  get sebiCharges(): Money { return this.props.charges.sebiCharges; }
  get stampDuty(): Money { return this.props.charges.stampDuty; }
  get gst(): Money { return this.props.charges.gst; }
  get totalCharges(): Money { return this.props.charges.totalCharges; }
  get executedAt(): Date { return this.props.executedAt; }
}
