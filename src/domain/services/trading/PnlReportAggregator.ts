import { Position } from "../../entities/trading/Position";
import { Money } from "../../value-objects/Money";
import { TradeCharges } from "../../value-objects/trading/TradeCharges";
import { FifoMatchingResult, ScripTradeLedger } from "./FifoLotMatcher";

export interface SymbolPnlSummary {
  symbol: string;
  exchange: string;
  closedQty: number;
  openQty: number;
  buyAvg: number;
  buyValue: Money;
  sellAvg: number;
  sellValue: Money;
  netRealizedPnL: Money;
  unrealizedPnL: Money;
}

export interface DailyPnlSummary {
  date: string;
  grossPnL: Money;
  netPnL: Money;
  tradesCount: number;
}

export interface PnlCalculationReport {
  realizedPnL: Money;
  charges: Money;
  netRealizedPnL: Money;
  unrealizedPnL: Money;
  chargesBreakdown: TradeCharges;
  dailyPnl: DailyPnlSummary[];
  symbols: SymbolPnlSummary[];
}

interface SymbolAccumulator {
  symbol: string;
  exchange: string;
  closedQty: number;
  openQty: number;
  buyTurnover: Money;
  sellTurnover: Money;
  grossRealizedPnL: Money;
  totalCharges: Money;
  unrealizedPnL: Money;
}

/**
 * Pure domain service responsible for evaluating open-lot MTM unrealized P&L
 * and aggregating scrip ledgers across segments into symbol and portfolio totals.
 */
export class PnlReportAggregator {
  /**
   * Computes unrealized MTM P&L for open lots and combines CNC/MIS ledgers
   * into per-symbol and overall P&L summaries.
   */
  static aggregate(params: {
    matching: FifoMatchingResult;
    stockExchangeMap: ReadonlyMap<string, string>;
    ltpBySymbol: ReadonlyMap<string, number>;
  }): PnlCalculationReport {
    const { matching, stockExchangeMap, ltpBySymbol } = params;

    let totalRealizedGross = Money.zero();
    let totalUnrealized = Money.zero();
    let totalCharges = TradeCharges.zero();
    const symbolMap = new Map<string, SymbolAccumulator>();

    for (const ledger of matching.ledgers) {
      const exchange = stockExchangeMap.get(ledger.symbol) ?? "NSE";
      const { openQty, unrealizedPnL } = this.evaluateOpenLots(
        ledger,
        matching.openPositions,
        ltpBySymbol.get(ledger.symbol)
      );

      this.accumulateSymbol(
        symbolMap,
        ledger,
        exchange,
        openQty,
        unrealizedPnL
      );

      totalRealizedGross = totalRealizedGross.add(ledger.grossRealizedPnL);
      totalUnrealized = totalUnrealized.add(unrealizedPnL);
      totalCharges = totalCharges.add(ledger.charges);
    }

    const symbols = this.buildSymbolSummaries(symbolMap);
    const dailyPnl: DailyPnlSummary[] = Array.from(
      matching.dailyPnlMap.keys()
    )
      .sort()
      .map((date) => {
        const entry = matching.dailyPnlMap.get(date)!;
        return {
          date,
          grossPnL: entry.gross,
          netPnL: entry.net,
          tradesCount: entry.count,
        };
      });

    return {
      realizedPnL: totalRealizedGross,
      charges: totalCharges.totalCharges,
      netRealizedPnL: totalRealizedGross.subtract(totalCharges.totalCharges),
      unrealizedPnL: totalUnrealized,
      chargesBreakdown: totalCharges,
      dailyPnl,
      symbols,
    };
  }

  private static evaluateOpenLots(
    ledger: ScripTradeLedger,
    openPositions: Position[],
    liveLtp?: number
  ): { openQty: number; unrealizedPnL: Money } {
    if (ledger.buyQueue.length === 0 && ledger.sellQueue.length === 0) {
      return { openQty: 0, unrealizedPnL: Money.zero() };
    }

    const openPosition = openPositions.find(
      (p) =>
        p.symbol.toUpperCase().trim() === ledger.symbol &&
        p.productType === ledger.productType
    );

    const fallbackPrice =
      ledger.buyQueue.length > 0
        ? ledger.buyQueue[0].entryPrice.toNumber()
        : ledger.sellQueue.length > 0
        ? ledger.sellQueue[0].entryPrice.toNumber()
        : openPosition?.averagePrice ?? 0;

    const currentLtp = liveLtp && liveLtp > 0 ? liveLtp : fallbackPrice;
    const ltpMoney = Money.of(currentLtp);

    let openQty = 0;
    let unrealizedPnL = Money.zero();

    for (const openLot of ledger.buyQueue) {
      if (openLot.remainingQty > 0) {
        const lotCost = openLot.entryPrice.multiply(openLot.remainingQty);
        const lotCurrent = ltpMoney.multiply(openLot.remainingQty);
        openQty += openLot.remainingQty;
        unrealizedPnL = unrealizedPnL.add(lotCurrent.subtract(lotCost));
      }
    }

    for (const openLot of ledger.sellQueue) {
      if (openLot.remainingQty > 0) {
        const lotSellVal = openLot.entryPrice.multiply(openLot.remainingQty);
        const lotCurrentCost = ltpMoney.multiply(openLot.remainingQty);
        openQty -= openLot.remainingQty;
        unrealizedPnL = unrealizedPnL.add(lotSellVal.subtract(lotCurrentCost));
      }
    }

    return { openQty, unrealizedPnL };
  }

  private static accumulateSymbol(
    symbolMap: Map<string, SymbolAccumulator>,
    ledger: ScripTradeLedger,
    exchange: string,
    openQty: number,
    unrealizedPnL: Money
  ): void {
    const existing = symbolMap.get(ledger.symbol);
    if (!existing) {
      symbolMap.set(ledger.symbol, {
        symbol: ledger.symbol,
        exchange,
        closedQty: ledger.closedQty,
        openQty: Math.abs(openQty),
        buyTurnover: ledger.buyTurnover,
        sellTurnover: ledger.sellTurnover,
        grossRealizedPnL: ledger.grossRealizedPnL,
        totalCharges: ledger.charges.totalCharges,
        unrealizedPnL,
      });
      return;
    }

    existing.closedQty += ledger.closedQty;
    existing.openQty += Math.abs(openQty);
    existing.buyTurnover = existing.buyTurnover.add(ledger.buyTurnover);
    existing.sellTurnover = existing.sellTurnover.add(ledger.sellTurnover);
    existing.grossRealizedPnL = existing.grossRealizedPnL.add(
      ledger.grossRealizedPnL
    );
    existing.totalCharges = existing.totalCharges.add(
      ledger.charges.totalCharges
    );
    existing.unrealizedPnL = existing.unrealizedPnL.add(unrealizedPnL);
  }

  private static buildSymbolSummaries(
    symbolMap: Map<string, SymbolAccumulator>
  ): SymbolPnlSummary[] {
    const symbols: SymbolPnlSummary[] = [];

    for (const acc of symbolMap.values()) {
      if (acc.closedQty === 0 && acc.openQty === 0) {
        continue;
      }

      symbols.push({
        symbol: acc.symbol,
        exchange: acc.exchange,
        closedQty: acc.closedQty,
        openQty: acc.openQty,
        buyAvg:
          acc.closedQty > 0
            ? acc.buyTurnover.divide(acc.closedQty).toNumber()
            : 0,
        buyValue: acc.buyTurnover,
        sellAvg:
          acc.closedQty > 0
            ? acc.sellTurnover.divide(acc.closedQty).toNumber()
            : 0,
        sellValue: acc.sellTurnover,
        netRealizedPnL: acc.grossRealizedPnL.subtract(acc.totalCharges),
        unrealizedPnL: acc.unrealizedPnL,
      });
    }

    return symbols;
  }
}
