import { MarketQuote } from "../../entities/market/MarketQuote";
import {
  Position,
  PositionSide,
  ProductType,
} from "../../entities/trading/Position";
import { Trade } from "../../entities/trading/Trade";
import { Money } from "../../value-objects/Money";

export interface EvaluatedPositionItem {
  id: string;
  symbol: string;
  productType: ProductType;
  side: PositionSide;
  quantity: number;
  averagePrice: number;
  currentLtp: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  isOpen: boolean;
  updatedAt: Date;
}

export interface PositionsValuationSummary {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  netPnL: number;
  totalCount: number;
  openCount: number;
  closedCount: number;
}

export interface PositionsValuationResult {
  items: EvaluatedPositionItem[];
  summary: PositionsValuationSummary;
}

/**
 * Pure domain service responsible for intraday MIS session position selection,
 * today's realized P&L aggregation, and live unrealized MTM valuation.
 */
export class PositionsValuationCalculator {
  /**
   * Selects MIS positions that are currently open or were updated in today's session.
   */
  static selectSessionPositions(
    positions: Position[],
    startOfTodayIst: Date
  ): Position[] {
    return positions.filter(
      (pos) =>
        pos.productType === ProductType.MIS &&
        (pos.isOpen() || pos.updatedAt >= startOfTodayIst)
    );
  }

  /**
   * Evaluates intraday MIS positions and aggregates session realized/unrealized P&L.
   */
  static evaluate(params: {
    sessionPositions: Position[];
    todayTrades: Trade[];
    quotesBySymbol: ReadonlyMap<string, MarketQuote | null>;
  }): PositionsValuationResult {
    const { sessionPositions, todayTrades, quotesBySymbol } = params;

    const { todayRealizedByKey, totalRealizedPnL } =
      this.aggregateTodayRealized(todayTrades);

    let totalUnrealizedMoney = Money.zero();
    let openCount = 0;
    let closedCount = 0;

    const items: EvaluatedPositionItem[] = sessionPositions.map((pos) => {
      const quote = quotesBySymbol.get(pos.symbol) ?? null;
      const currentLtp =
        quote?.ltp && quote.ltp > 0 ? quote.ltp : pos.averagePrice;
      const item = this.buildEvaluatedItem(pos, todayRealizedByKey, currentLtp);

      if (item.isOpen) {
        openCount++;
        totalUnrealizedMoney = totalUnrealizedMoney.add(item.unrealizedPnL);
      } else {
        closedCount++;
      }

      return item;
    });

    const realizedNum = totalRealizedPnL.toNumber();
    const unrealizedNum = totalUnrealizedMoney.toNumber();

    return {
      items,
      summary: {
        totalRealizedPnL: realizedNum,
        totalUnrealizedPnL: unrealizedNum,
        netPnL: +(realizedNum + unrealizedNum).toFixed(2),
        totalCount: sessionPositions.length,
        openCount,
        closedCount,
      },
    };
  }

  /**
   * Evaluates a single position against its today's realized trades and a resolved LTP.
   */
  static evaluateSinglePosition(
    pos: Position,
    todayTrades: Trade[],
    currentLtp: number
  ): EvaluatedPositionItem {
    const { todayRealizedByKey } = this.aggregateTodayRealized(todayTrades);
    return this.buildEvaluatedItem(pos, todayRealizedByKey, currentLtp);
  }

  private static buildEvaluatedItem(
    pos: Position,
    todayRealizedByKey: ReadonlyMap<string, Money>,
    currentLtp: number
  ): EvaluatedPositionItem {
    const unrealizedPnL = pos.calculateUnrealizedPnL(currentLtp);
    const realizedPnL =
      todayRealizedByKey.get(`${pos.symbol}:${pos.productType}`)?.toNumber() ??
      0;
    const totalPnL = +(realizedPnL + unrealizedPnL).toFixed(2);
    const totalCost = +(pos.averagePrice * pos.quantity).toFixed(2);
    const pnlPercentage =
      totalCost > 0 ? +((unrealizedPnL / totalCost) * 100).toFixed(2) : 0;

    return {
      id: pos.id,
      symbol: pos.symbol,
      productType: pos.productType,
      side: pos.side,
      quantity: pos.quantity,
      averagePrice: pos.averagePrice,
      currentLtp,
      unrealizedPnL,
      realizedPnL,
      totalPnL,
      pnlPercentage,
      isOpen: pos.isOpen(),
      updatedAt: pos.updatedAt,
    };
  }

  private static aggregateTodayRealized(todayTrades: Trade[]): {
    todayRealizedByKey: Map<string, Money>;
    totalRealizedPnL: Money;
  } {
    const todayRealizedByKey = new Map<string, Money>();
    let totalRealizedPnL = Money.zero();

    for (const trade of todayTrades) {
      if (trade.productType !== ProductType.MIS) {
        continue;
      }

      const key = `${trade.symbol}:${trade.productType}`;
      const prev = todayRealizedByKey.get(key) ?? Money.zero();
      todayRealizedByKey.set(key, prev.add(trade.realizedPnL));
      totalRealizedPnL = totalRealizedPnL.add(trade.realizedPnL);
    }

    return { todayRealizedByKey, totalRealizedPnL };
  }
}
