import { Money, MoneyInput } from "../Money";

export interface TradeChargesProps {
  brokerage: MoneyInput;
  stt: MoneyInput;
  exchangeTurnoverCharges: MoneyInput;
  sebiCharges: MoneyInput;
  stampDuty: MoneyInput;
  gst: MoneyInput;
  totalCharges: MoneyInput;
}

export class TradeCharges {
  private constructor(
    private readonly props: {
      brokerage: Money;
      stt: Money;
      exchangeTurnoverCharges: Money;
      sebiCharges: Money;
      stampDuty: Money;
      gst: Money;
      totalCharges: Money;
    }
  ) {}

  static create(props: TradeChargesProps): TradeCharges {
    return new TradeCharges({
      brokerage: Money.of(props.brokerage),
      stt: Money.of(props.stt),
      exchangeTurnoverCharges: Money.of(props.exchangeTurnoverCharges),
      sebiCharges: Money.of(props.sebiCharges),
      stampDuty: Money.of(props.stampDuty),
      gst: Money.of(props.gst),
      totalCharges: Money.of(props.totalCharges),
    });
  }

  static zero(): TradeCharges {
    return new TradeCharges({
      brokerage: Money.zero(),
      stt: Money.zero(),
      exchangeTurnoverCharges: Money.zero(),
      sebiCharges: Money.zero(),
      stampDuty: Money.zero(),
      gst: Money.zero(),
      totalCharges: Money.zero(),
    });
  }

  get brokerage(): Money { return this.props.brokerage; }
  get stt(): Money { return this.props.stt; }
  get exchangeTurnoverCharges(): Money { return this.props.exchangeTurnoverCharges; }
  get sebiCharges(): Money { return this.props.sebiCharges; }
  get stampDuty(): Money { return this.props.stampDuty; }
  get gst(): Money { return this.props.gst; }
  get totalCharges(): Money { return this.props.totalCharges; }
  get total(): Money { return this.props.totalCharges; }

  /**
   * Returns a new TradeCharges instance representing the sum of this and another instance.
   */
  add(other: TradeCharges): TradeCharges {
    return new TradeCharges({
      brokerage: this.props.brokerage.add(other.brokerage),
      stt: this.props.stt.add(other.stt),
      exchangeTurnoverCharges: this.props.exchangeTurnoverCharges.add(
        other.exchangeTurnoverCharges
      ),
      sebiCharges: this.props.sebiCharges.add(other.sebiCharges),
      stampDuty: this.props.stampDuty.add(other.stampDuty),
      gst: this.props.gst.add(other.gst),
      totalCharges: this.props.totalCharges.add(other.totalCharges),
    });
  }

  /**
   * Returns a new TradeCharges instance representing the difference of this minus another instance.
   */
  subtract(other: TradeCharges): TradeCharges {
    return new TradeCharges({
      brokerage: this.props.brokerage.subtract(other.brokerage),
      stt: this.props.stt.subtract(other.stt),
      exchangeTurnoverCharges: this.props.exchangeTurnoverCharges.subtract(
        other.exchangeTurnoverCharges
      ),
      sebiCharges: this.props.sebiCharges.subtract(other.sebiCharges),
      stampDuty: this.props.stampDuty.subtract(other.stampDuty),
      gst: this.props.gst.subtract(other.gst),
      totalCharges: this.props.totalCharges.subtract(other.totalCharges),
    });
  }

  /**
   * Scales all charge components by a numeric factor.
   */
  multiply(factor: number): TradeCharges {
    return new TradeCharges({
      brokerage: this.props.brokerage.multiply(factor),
      stt: this.props.stt.multiply(factor),
      exchangeTurnoverCharges: this.props.exchangeTurnoverCharges.multiply(factor),
      sebiCharges: this.props.sebiCharges.multiply(factor),
      stampDuty: this.props.stampDuty.multiply(factor),
      gst: this.props.gst.multiply(factor),
      totalCharges: this.props.totalCharges.multiply(factor),
    });
  }

  /**
   * Allocates a proportional share from remaining charges while ensuring the final
   * matched lot consumes the exact remaining balance without 1-paisa rounding drift.
   */
  allocateShare(params: {
    original: TradeCharges;
    matchedQty: number;
    remainingQty: number;
    originalQty: number;
  }): { allocated: TradeCharges; remaining: TradeCharges } {
    const { original, matchedQty, remainingQty, originalQty } = params;
    if (matchedQty === remainingQty) {
      return {
        allocated: this,
        remaining: TradeCharges.zero(),
      };
    }

    const allocated = original.multiply(matchedQty / originalQty);
    return {
      allocated,
      remaining: this.subtract(allocated),
    };
  }

  toNumericValues() {
    return {
      brokerage: this.props.brokerage.toNumber(),
      stt: this.props.stt.toNumber(),
      exchangeTurnoverCharges: this.props.exchangeTurnoverCharges.toNumber(),
      sebiCharges: this.props.sebiCharges.toNumber(),
      stampDuty: this.props.stampDuty.toNumber(),
      gst: this.props.gst.toNumber(),
      totalCharges: this.props.totalCharges.toNumber(),
    };
  }

  toJSON() {
    return this.toNumericValues();
  }
}
