import { ProductType } from "../../../domain/entities/trading/Order";

export class MarginCalculatorService {
  private static readonly INTRADAY_LEVERAGE = 5; // 5x leverage for MIS (20% margin)

  /**
   * Calculates the required virtual margin for an order.
   */
  static calculateRequiredMargin(productType: ProductType, quantity: number, price: number): number {
    const totalOrderValue = +(quantity * price).toFixed(2);

    if (productType === ProductType.MIS) {
      return +(totalOrderValue / this.INTRADAY_LEVERAGE).toFixed(2);
    }

    // CNC Delivery requires 100% upfront capital
    return totalOrderValue;
  }
}

