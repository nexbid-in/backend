import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export const InstrumentType = {
  EQUITY: "EQUITY",
  INDEX: "INDEX",
} as const;

export type InstrumentType = (typeof InstrumentType)[keyof typeof InstrumentType];

export interface StockProps {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string | null;
  type?: InstrumentType;
  isActive?: boolean;
  isTradable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Stock {
  private constructor(
    private readonly props: {
      id: string;
      symbol: string;
      name: string;
      exchange: string;
      sector: string | null;
      type: InstrumentType;
      isActive: boolean;
      isTradable: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  ) {}

  static create(props: StockProps): Stock {
    if (!props.id || !props.symbol || !props.name) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    const type = props.type ?? InstrumentType.EQUITY;

    return new Stock({
      id: props.id,
      symbol: props.symbol.toUpperCase().trim(),
      name: props.name.trim(),
      exchange: props.exchange ?? "NSE",
      sector: props.sector ?? null,
      type,
      isActive: props.isActive ?? true,
      // Rule: Indices are NEVER tradable in the equity cash/delivery segment
      isTradable: type === InstrumentType.INDEX ? false : (props.isTradable ?? true),
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  get id(): string { return this.props.id; }
  get symbol(): string { return this.props.symbol; }
  get name(): string { return this.props.name; }
  get exchange(): string { return this.props.exchange; }
  get sector(): string | null { return this.props.sector; }
  get type(): InstrumentType { return this.props.type; }
  get isActive(): boolean { return this.props.isActive; }
  get isTradable(): boolean { return this.props.isTradable; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
