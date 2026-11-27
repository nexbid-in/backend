import { MarketQuote } from "../../entities/market/MarketQuote";
import { Position, ProductType } from "../../entities/trading/Position";
import { Money } from "../../value-objects/Money";

export interface EvaluatedHoldingItem {
  id: string;
  symbol: string;
  quantity: number;
  buyAvgPrice: number;
  currentLtp: number;
  investedAmount: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  dayPnL: number;
  isBoughtToday: boolean;
  isExited?: boolean;
}

export interface HoldingsValuationSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  todayPnL: number;
  todayPnLPercentage: number;
  holdingsCount: number;
  exitedCount: number;
}

export interface HoldingsValuationResult {
  holdings: EvaluatedHoldingItem[];
  exitedHoldings: EvaluatedHoldingItem[];
  summary: HoldingsValuationSummary;
}

/**
 * Pure domain service responsible for CNC delivery holdings selection,
 * live mark-to-market valuation, day P&L rules, and portfolio summary totals.
 */
export class HoldingsValuationCalculator {
  /**
   * Selects active CNC holdings (qty > 0) and today-exited CNC positions.
   */
  static selectHoldings(
    positions: Position[],
    startOfTodayIst: Date
  ): { active: Position[]; exitedToday: Position[] } {
    const active = positions.filter(
      (pos) => pos.productType === ProductType.CNC && pos.quantity > 0
    );
    const exitedToday = positions.filter(
      (pos) =>
        pos.productType === ProductType.CNC &&
        pos.quantity === 0 &&
        pos.sellQty > 0 &&
        pos.updatedAt >= startOfTodayIst
    );

    return { active, exitedToday };
  }

  /**
   * Evaluates active and exited CNC holdings against live quotes and computes summary totals.
   */
  static evaluate(params: {
    positions: Position[];
    quotesBySymbol: ReadonlyMap<string, MarketQuote | null>;
    startOfTodayIst: Date;
    includeExited?: boolean;
  }): HoldingsValuationResult {
    const {
      positions,
      quotesBySymbol,
      startOfTodayIst,
      includeExited = true,
    } = params;

    const { active, exitedToday } = this.selectHoldings(
      positions,
      startOfTodayIst
    );

    let totalInvestedMoney = Money.zero();
    let totalCurrentValueMoney = Money.zero();
    let totalTodayPnlMoney = Money.zero();

    const holdings: EvaluatedHoldingItem[] = active.map((pos) => {
      const quote = quotesBySymbol.get(pos.symbol) ?? null;
      const evaluated = this.evaluateActiveHolding(pos, quote, startOfTodayIst);

      totalInvestedMoney = totalInvestedMoney.add(evaluated.investedAmount);
      totalCurrentValueMoney = totalCurrentValueMoney.add(
        evaluated.currentValue
      );
      totalTodayPnlMoney = totalTodayPnlMoney.add(evaluated.dayPnL);

      return evaluated;
    });

    const exitedHoldings: EvaluatedHoldingItem[] = includeExited
      ? exitedToday.map((pos) =>
          this.evaluateExitedHolding(
            pos,
            quotesBySymbol.get(pos.symbol) ?? null,
            startOfTodayIst
          )
        )
      : [];

    const totalInvested = totalInvestedMoney.toNumber();
    const currentValue = totalCurrentValueMoney.toNumber();
    const todayPnL = totalTodayPnlMoney.toNumber();
    const totalPnL = totalCurrentValueMoney
      .subtract(totalInvestedMoney)
      .toNumber();

    return {
      holdings,
      exitedHoldings,
      summary: {
        totalInvested,
        currentValue,
        totalPnL,
        totalPnLPercentage: this.computePercentage(totalPnL, totalInvested),
        todayPnL,
        todayPnLPercentage: this.computePercentage(todayPnL, totalInvested),
        holdingsCount: active.length,
        exitedCount: exitedToday.length,
      },
    };
  }

  private static evaluateActiveHolding(
    pos: Position,
    quote: MarketQuote | null,
    startOfTodayIst: Date
  ): EvaluatedHoldingItem {
    const currentLtp =
      quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;

    const investedAmount = Money.of(pos.averagePrice)
      .multiply(pos.quantity)
      .toNumber();
    const currentValue = Money.of(currentLtp).multiply(pos.quantity).toNumber();
    const totalPnL = +(currentValue - investedAmount).toFixed(2);
    const totalPnLPercentage = this.computePercentage(totalPnL, investedAmount);
    const isBoughtToday = pos.createdAt >= startOfTodayIst;

    let dayChange: number;
    let dayChangePercentage: number;
    let dayPnL: number;

    if (isBoughtToday) {
      dayChange = +(currentLtp - pos.averagePrice).toFixed(2);
      dayChangePercentage = this.computePercentage(dayChange, pos.averagePrice);
      dayPnL = totalPnL;
    } else {
      dayChange = this.resolvePreviousCloseChange(quote, currentLtp);
      dayChangePercentage =
        quote?.changePercent ??
        (quote?.close && quote.close > 0
          ? this.computePercentage(dayChange, quote.close)
          : 0);
      dayPnL = +(dayChange * pos.quantity).toFixed(2);
    }

    return {
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.quantity,
      buyAvgPrice: pos.averagePrice,
      currentLtp,
      investedAmount,
      currentValue,
      totalPnL,
      totalPnLPercentage,
      dayChange,
      dayChangePercentage,
      dayPnL,
      isBoughtToday,
    };
  }

  private static evaluateExitedHolding(
    pos: Position,
    quote: MarketQuote | null,
    startOfTodayIst: Date
  ): EvaluatedHoldingItem {
    const currentLtp =
      quote?.ltp && quote.ltp > 0
        ? quote.ltp
        : pos.sellQty > 0
        ? +(pos.sellAmount / pos.sellQty).toFixed(2)
        : pos.averagePrice;

    const buyAvgPrice =
      pos.buyQty > 0
        ? +(pos.buyAmount / pos.buyQty).toFixed(2)
        : pos.averagePrice;
    const investedAmount = pos.buyAmount;
    const currentValue = pos.sellAmount;
    const totalPnL = pos.realizedPnL;

    return {
      id: pos.id,
      symbol: pos.symbol,
      quantity: pos.sellQty,
      buyAvgPrice,
      currentLtp,
      investedAmount,
      currentValue,
      totalPnL,
      totalPnLPercentage: this.computePercentage(totalPnL, investedAmount),
      dayChange: quote?.change ?? 0,
      dayChangePercentage: quote?.changePercent ?? 0,
      dayPnL: totalPnL,
      isBoughtToday: pos.createdAt >= startOfTodayIst,
      isExited: true,
    };
  }

  private static resolvePreviousCloseChange(
    quote: MarketQuote | null,
    currentLtp: number
  ): number {
    if (!quote) {
      return 0;
    }
    if (quote.change !== 0 || !quote.close || quote.close <= 0) {
      return quote.change;
    }
    return +(currentLtp - quote.close).toFixed(2);
  }

  private static computePercentage(part: number, base: number): number {
    return base > 0 ? +((part / base) * 100).toFixed(2) : 0;
  }
}
