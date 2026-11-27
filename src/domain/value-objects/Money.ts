import { Decimal } from "decimal.js";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type MoneyInput = Money | Decimal | number | string | { toString(): string };

export class Money {
  private readonly _amount: Decimal;

  private constructor(value: Decimal) {
    this._amount = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  public static of(value: MoneyInput): Money {
    if (value instanceof Money) {
      return value;
    }
    try {
      const dec = new Decimal(typeof value === "object" && value !== null && "toString" in value ? value.toString() : value);
      if (dec.isNaN()) {
        throw new AppError(ErrorCodes.INVALID_AMOUNT);
      }
      return new Money(dec);
    } catch {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }
  }

  public static zero(): Money {
    return new Money(new Decimal(0));
  }

  public add(other: MoneyInput): Money {
    const o = Money.of(other);
    return new Money(this._amount.plus(o._amount));
  }

  public subtract(other: MoneyInput): Money {
    const o = Money.of(other);
    return new Money(this._amount.minus(o._amount));
  }

  public multiply(factor: number | string | Decimal): Money {
    return new Money(this._amount.times(new Decimal(factor.toString())));
  }

  public divide(divisor: number | string | Decimal): Money {
    const d = new Decimal(divisor.toString());
    if (d.isZero()) {
      throw new AppError(ErrorCodes.INVALID_AMOUNT);
    }
    return new Money(this._amount.dividedBy(d));
  }

  public isGreaterThan(other: MoneyInput): boolean {
    return this._amount.gt(Money.of(other)._amount);
  }

  public isGreaterThanOrEqual(other: MoneyInput): boolean {
    return this._amount.gte(Money.of(other)._amount);
  }

  public isLessThan(other: MoneyInput): boolean {
    return this._amount.lt(Money.of(other)._amount);
  }

  public isLessThanOrEqual(other: MoneyInput): boolean {
    return this._amount.lte(Money.of(other)._amount);
  }

  public equals(other: MoneyInput): boolean {
    return this._amount.eq(Money.of(other)._amount);
  }

  public isPositive(): boolean {
    return this._amount.gt(0);
  }

  public isNegative(): boolean {
    return this._amount.lt(0);
  }

  public isZero(): boolean {
    return this._amount.isZero();
  }

  public toDecimal(): Decimal {
    return this._amount;
  }

  public toFixed(digits = 2): string {
    return this._amount.toFixed(digits);
  }

  public toString(): string {
    return this._amount.toFixed(2);
  }

  public toNumber(): number {
    return this._amount.toNumber();
  }
}
