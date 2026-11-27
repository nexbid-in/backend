import { OrderSide } from "../../entities/trading/Order";
import { Trade } from "../../entities/trading/Trade";
import { Money } from "../../value-objects/Money";
import { TradeCharges } from "../../value-objects/trading/TradeCharges";

export interface TradebookSummary {
  totalTrades: number;
  totalBuyTurnover: Money;
  totalSellTurnover: Money;
  charges: TradeCharges;
}

/**
 * Pure domain service responsible for aggregating macro turnover and charge
 * breakdown totals across executed trades.
 */
export class TradebookCalculator {
  static summarize(trades: Trade[]): TradebookSummary {
    let totalBuyTurnover = Money.zero();
    let totalSellTurnover = Money.zero();
    let charges = TradeCharges.zero();

    for (const trade of trades) {
      charges = charges.add(trade.charges);
      if (trade.side === OrderSide.BUY) {
        totalBuyTurnover = totalBuyTurnover.add(trade.tradeValue);
      } else {
        totalSellTurnover = totalSellTurnover.add(trade.tradeValue);
      }
    }

    return {
      totalTrades: trades.length,
      totalBuyTurnover,
      totalSellTurnover,
      charges,
    };
  }
}
