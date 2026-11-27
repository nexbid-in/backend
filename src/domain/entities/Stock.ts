import crypto from "crypto";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export const InstrumentType = {
  EQUITY: "EQUITY",
  INDEX: "INDEX",
} as const;

export type InstrumentType = (typeof InstrumentType)[keyof typeof InstrumentType];

export interface StockProps {
  id?: string;
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string | null;
  type?: InstrumentType;
  feedSymbol?: string | null;
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
      feedSymbol: string | null;
      isActive: boolean;
      isTradable: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  ) {}

  static create(props: StockProps): Stock {
    if (!props.symbol || !props.name) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    const id = props.id ?? crypto.randomUUID();
    const type = props.type ?? InstrumentType.EQUITY;

    return new Stock({
      id,
      symbol: props.symbol.toUpperCase().trim(),
      name: props.name.trim(),
      exchange: props.exchange ?? "NSE",
      sector: props.sector ?? null,
      type,
      feedSymbol: props.feedSymbol ? props.feedSymbol.toUpperCase().trim() : null,
      isActive: props.isActive ?? true,
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
  get feedSymbol(): string | null { return this.props.feedSymbol; }
  get isActive(): boolean { return this.props.isActive; }
  get isTradable(): boolean { return this.props.isTradable; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updateStatus(isActive?: boolean, isTradable?: boolean): void {
    if (this.props.type === InstrumentType.INDEX && isTradable === true) {
      throw new AppError(ErrorCodes.INDEX_CANNOT_BE_TRADABLE);
    }
    if (isActive !== undefined) {
      this.props.isActive = isActive;
    }
    if (isTradable !== undefined) {
      this.props.isTradable = this.props.type === InstrumentType.INDEX ? false : isTradable;
    }
    this.props.updatedAt = new Date();
  }

  updateMetadata(data: {
    name?: string;
    exchange?: string;
    sector?: string | null;
    type?: InstrumentType;
    feedSymbol?: string | null;
  }): void {
    if (data.name !== undefined) {
      this.props.name = data.name.trim();
    }
    if (data.exchange !== undefined) {
      this.props.exchange = data.exchange.toUpperCase().trim();
    }
    if (data.sector !== undefined) {
      this.props.sector = data.sector ? data.sector.trim() : null;
    }
    if (data.type !== undefined) {
      this.props.type = data.type;
      if (data.type === InstrumentType.INDEX) {
        this.props.isTradable = false;
      }
    }
    if (data.feedSymbol !== undefined) {
      this.props.feedSymbol = data.feedSymbol ? data.feedSymbol.toUpperCase().trim() : null;
    }
    this.props.updatedAt = new Date();
  }
}
