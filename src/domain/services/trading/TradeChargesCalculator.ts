import { Decimal } from "decimal.js";
import { OrderSide, ProductType } from "../../entities/trading/Order";
import { Money, MoneyInput } from "../../value-objects/Money";
import { TradeCharges } from "../../value-objects/trading/TradeCharges";

export class TradeChargesCalculator {
  // Discount broker standard rates (SEBI / NSE / Indian Stamp Act / Income Tax Act)
  private static readonly INTRADAY_BROKERAGE_PCT = new Decimal("0.0003"); // 0.03%
  private static readonly MAX_INTRADAY_BROKERAGE = Money.of(20.0);       // Flat ₹20 cap
  private static readonly NSE_EXCHANGE_RATE = new Decimal("0.0000297");   // 0.00297% (₹297 / Cr)
  private static readonly SEBI_RATE = new Decimal("0.000001");            // ₹10 per crore (0.0001%)
  private static readonly GST_RATE = new Decimal("0.18");                 // 18%

  // STT: 0.1% on Buy & Sell for Delivery (CNC), 0.025% on Sell only for Intraday (MIS)
  private static readonly STT_CNC_RATE = new Decimal("0.001");
  private static readonly STT_MIS_SELL_RATE = new Decimal("0.00025");

  // Stamp Duty: Levied on Buy turnover only (0.015% for CNC, 0.003% for MIS)
  private static readonly STAMP_DUTY_CNC_BUY = new Decimal("0.00015");
  private static readonly STAMP_DUTY_MIS_BUY = new Decimal("0.00003");

  public static calculate(
    side: OrderSide,
    productType: ProductType,
    quantity: number,
    price: MoneyInput
  ): TradeCharges {
    const priceMoney = Money.of(price);
    if (quantity <= 0 || !priceMoney.isPositive()) {
      return TradeCharges.zero();
    }

    const turnover = priceMoney.multiply(quantity);
    const turnoverDec = turnover.toDecimal();

    // 1. Brokerage
    let brokerage = Money.zero();
    if (productType === ProductType.MIS) {
      const calcBrokerage = Money.of(turnoverDec.times(this.INTRADAY_BROKERAGE_PCT));
      brokerage = calcBrokerage.isGreaterThan(this.MAX_INTRADAY_BROKERAGE)
        ? this.MAX_INTRADAY_BROKERAGE
        : calcBrokerage;
    } else {
      brokerage = Money.zero();
    }

    // 2. STT: Indian tax law rounds STT to nearest rupee
    let stt = Money.zero();
    if (productType === ProductType.CNC) {
      const sttDec = turnoverDec.times(this.STT_CNC_RATE).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      stt = Money.of(sttDec);
    } else if (productType === ProductType.MIS && side === OrderSide.SELL) {
      const sttDec = turnoverDec.times(this.STT_MIS_SELL_RATE).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      stt = Money.of(sttDec);
    }

    // 3. Exchange Turnover Charges (NSE)
    const exchangeTurnoverCharges = Money.of(turnoverDec.times(this.NSE_EXCHANGE_RATE));

    // 4. SEBI Turnover Charges
    const sebiCharges = Money.of(turnoverDec.times(this.SEBI_RATE));

    // 5. Stamp Duty (Buy side only, rounded to nearest rupee)
    let stampDuty = Money.zero();
    if (side === OrderSide.BUY) {
      const stampRate =
        productType === ProductType.CNC ? this.STAMP_DUTY_CNC_BUY : this.STAMP_DUTY_MIS_BUY;
      const stampDec = turnoverDec.times(stampRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      stampDuty = Money.of(stampDec);
    }

    // 6. GST: 18% charged on (Brokerage + Exchange Charges + SEBI Charges)
    const taxableAmount = brokerage.add(exchangeTurnoverCharges).add(sebiCharges);
    const gst = Money.of(taxableAmount.toDecimal().times(this.GST_RATE));

    const totalCharges = brokerage
      .add(stt)
      .add(exchangeTurnoverCharges)
      .add(sebiCharges)
      .add(stampDuty)
      .add(gst);

    return TradeCharges.create({
      brokerage,
      stt,
      exchangeTurnoverCharges,
      sebiCharges,
      stampDuty,
      gst,
      totalCharges,
    });
  }
}
