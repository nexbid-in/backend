import { ProductType } from "../../../domain/entities/trading/Order";
import { Money } from "../../../domain/value-objects/Money";

export const DEFAULT_PRODUCT_LEVERAGES: Readonly<Record<ProductType, number>> = {
  [ProductType.CNC]: 1,
  [ProductType.MIS]: 5,
};

/**
 * Calculates required margin per product type using an extensible leverage policy map.
 */
export class MarginCalculatorService {
  constructor(
    private readonly leverageByProduct: Readonly<Record<ProductType, number>> = DEFAULT_PRODUCT_LEVERAGES
  ) {}

  getLeverage(productType: ProductType): number {
    return this.leverageByProduct[productType] ?? 1;
  }

  calculateRequiredMargin(
    productType: ProductType,
    quantity: number,
    price: number
  ): number {
    const totalOrderValue = +(quantity * price).toFixed(2);
    const leverage = this.getLeverage(productType);

    if (leverage <= 1) {
      return totalOrderValue;
    }

    return +(totalOrderValue / leverage).toFixed(2);
  }

  calculateRequiredMarginMoney(
    productType: ProductType,
    quantity: number,
    price: Money
  ): Money {
    const totalOrderValue = price.multiply(quantity);
    const leverage = this.getLeverage(productType);

    if (leverage <= 1) {
      return totalOrderValue;
    }

    return totalOrderValue.divide(leverage);
  }
}

