import { OrderSide, ProductType } from "../../entities/trading/Order";
import { Position } from "../../entities/trading/Position";
import { Trade } from "../../entities/trading/Trade";
import { Money } from "../../value-objects/Money";
import { TradeCharges } from "../../value-objects/trading/TradeCharges";

export interface OpenLot {
  trade: Trade;
  entryDate: Date;
  entryPrice: Money;
  remainingQty: number;
  originalQty: number;
  remainingCharges: TradeCharges;
}

export interface ScripTradeLedger {
  symbol: string;
  productType: ProductType;
  buyQueue: OpenLot[];
  sellQueue: OpenLot[];
  closedQty: number;
  buyTurnover: Money;
  sellTurnover: Money;
  grossRealizedPnL: Money;
  charges: TradeCharges;
}

export interface DailyPnlEntry {
  gross: Money;
  net: Money;
  count: number;
}

export interface FifoMatchingResult {
  ledgers: ScripTradeLedger[];
  dailyPnlMap: Map<string, DailyPnlEntry>;
  openPositions: Position[];
  openSymbols: string[];
}

/**
 * Pure domain service responsible for chronological FIFO trade lot matching
 * per "SYMBOL:PRODUCT_TYPE" bucket and accumulating realized trade legs.
 */
export class FifoLotMatcher {
  /**
   * Matches trades chronologically in FIFO order, isolating product types (CNC vs MIS),
   * and returns matched scrip ledgers, daily realized totals, and open symbols.
   */
  static matchTrades(params: {
    trades: Trade[];
    positions: Position[];
    productTypeFilter?: ProductType;
    symbolFilter?: string;
    from?: Date;
    to?: Date;
  }): FifoMatchingResult {
    const { trades, positions, productTypeFilter, symbolFilter, from, to } = params;

    const chronologicalTrades = [...trades].sort(
      (a, b) => a.executedAt.getTime() - b.executedAt.getTime()
    );

    const tradesByScrip = this.groupTradesByScrip(chronologicalTrades);
    const openPositions = positions.filter((pos) => pos.isOpen());
    this.includeOpenPositionBuckets(
      tradesByScrip,
      openPositions,
      productTypeFilter,
      symbolFilter
    );

    const dailyPnlMap = new Map<string, DailyPnlEntry>();
    const ledgers: ScripTradeLedger[] = [];
    const openSymbolSet = new Set<string>();

    for (const [scripKey, scripTrades] of tradesByScrip.entries()) {
      const [symbol, productTypeStr] = scripKey.split(":");
      const productType = productTypeStr as ProductType;

      const ledger: ScripTradeLedger = {
        symbol,
        productType,
        buyQueue: [],
        sellQueue: [],
        closedQty: 0,
        buyTurnover: Money.zero(),
        sellTurnover: Money.zero(),
        grossRealizedPnL: Money.zero(),
        charges: TradeCharges.zero(),
      };

      for (const trade of scripTrades) {
        this.processTradeAgainstLedger(trade, ledger, dailyPnlMap, from, to);
      }

      if (
        ledger.buyQueue.length > 0 ||
        ledger.sellQueue.length > 0 ||
        openPositions.some(
          (p) =>
            p.symbol.toUpperCase().trim() === symbol &&
            p.productType === productType
        )
      ) {
        openSymbolSet.add(symbol);
      }

      ledgers.push(ledger);
    }

    return {
      ledgers,
      dailyPnlMap,
      openPositions,
      openSymbols: Array.from(openSymbolSet),
    };
  }

  private static groupTradesByScrip(trades: Trade[]): Map<string, Trade[]> {
    const tradesByScrip = new Map<string, Trade[]>();
    for (const trade of trades) {
      const key = `${trade.symbol.toUpperCase().trim()}:${trade.productType}`;
      const list = tradesByScrip.get(key) ?? [];
      list.push(trade);
      tradesByScrip.set(key, list);
    }
    return tradesByScrip;
  }

  private static includeOpenPositionBuckets(
    tradesByScrip: Map<string, Trade[]>,
    openPositions: Position[],
    productTypeFilter?: ProductType,
    symbolFilter?: string
  ): void {
    const normalizedSymbolFilter = symbolFilter?.toUpperCase().trim();

    for (const pos of openPositions) {
      const matchesProduct =
        !productTypeFilter || pos.productType === productTypeFilter;
      const matchesSymbol =
        !normalizedSymbolFilter ||
        normalizedSymbolFilter === pos.symbol.toUpperCase().trim();

      if (matchesProduct && matchesSymbol) {
        const key = `${pos.symbol.toUpperCase().trim()}:${pos.productType}`;
        if (!tradesByScrip.has(key)) {
          tradesByScrip.set(key, []);
        }
      }
    }
  }

  private static processTradeAgainstLedger(
    trade: Trade,
    ledger: ScripTradeLedger,
    dailyPnlMap: Map<string, DailyPnlEntry>,
    from?: Date,
    to?: Date
  ): void {
    const isBuy = trade.side === OrderSide.BUY;
    const counterQueue = isBuy ? ledger.sellQueue : ledger.buyQueue;
    const openQueue = isBuy ? ledger.buyQueue : ledger.sellQueue;

    let qtyRemaining = trade.quantity;
    let remainingTradeCharges = trade.charges;
    const tradePrice = trade.price;
    const exitDate = trade.executedAt;

    while (qtyRemaining > 0 && counterQueue.length > 0) {
      const counterLot = counterQueue[0];
      const matchedQty = Math.min(counterLot.remainingQty, qtyRemaining);

      const lotBuyValue = isBuy
        ? tradePrice.multiply(matchedQty)
        : counterLot.entryPrice.multiply(matchedQty);
      const lotSellValue = isBuy
        ? counterLot.entryPrice.multiply(matchedQty)
        : tradePrice.multiply(matchedQty);
      const lotGrossPnL = lotSellValue.subtract(lotBuyValue);

      const counterShare = counterLot.remainingCharges.allocateShare({
        original: counterLot.trade.charges,
        matchedQty,
        remainingQty: counterLot.remainingQty,
        originalQty: counterLot.originalQty,
      });
      counterLot.remainingCharges = counterShare.remaining;

      const currentShare = remainingTradeCharges.allocateShare({
        original: trade.charges,
        matchedQty,
        remainingQty: qtyRemaining,
        originalQty: trade.quantity,
      });
      remainingTradeCharges = currentShare.remaining;

      const legCharges = counterShare.allocated.add(currentShare.allocated);
      const legNetPnL = lotGrossPnL.subtract(legCharges.totalCharges);

      if ((!from || exitDate >= from) && (!to || exitDate <= to)) {
        ledger.closedQty += matchedQty;
        ledger.buyTurnover = ledger.buyTurnover.add(lotBuyValue);
        ledger.sellTurnover = ledger.sellTurnover.add(lotSellValue);
        ledger.grossRealizedPnL = ledger.grossRealizedPnL.add(lotGrossPnL);
        ledger.charges = ledger.charges.add(legCharges);

        const dayKey = exitDate.toISOString().split("T")[0];
        const dayEntry = dailyPnlMap.get(dayKey) ?? {
          gross: Money.zero(),
          net: Money.zero(),
          count: 0,
        };
        dayEntry.gross = dayEntry.gross.add(lotGrossPnL);
        dayEntry.net = dayEntry.net.add(legNetPnL);
        dayEntry.count += 1;
        dailyPnlMap.set(dayKey, dayEntry);
      }

      counterLot.remainingQty -= matchedQty;
      qtyRemaining -= matchedQty;

      if (counterLot.remainingQty === 0) {
        counterQueue.shift();
      }
    }

    if (qtyRemaining > 0) {
      openQueue.push({
        trade,
        entryDate: trade.executedAt,
        entryPrice: trade.price,
        remainingQty: qtyRemaining,
        originalQty: trade.quantity,
        remainingCharges: remainingTradeCharges,
      });
    }
  }
}
