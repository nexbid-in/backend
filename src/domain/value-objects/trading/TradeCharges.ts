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
