import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IGetPnlStatementUseCase } from "../../interface/use-cases/trading/IGetPnlStatementUseCase";
import {
  PnlStatementQueryDTO,
  GetPnlStatementResponseDTO,
  PnlSummaryDTO,
  PnlHeatmapSummaryDTO,
  PnlHeatmapDayDTO,
  PnlSymbolSummaryDTO,
} from "../../dto/trading/PnlDTOs";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Money } from "../../../domain/value-objects/Money";
import { Trade } from "../../../domain/entities/trading/Trade";

interface LotTracker {
  trade: Trade;
  entryDate: Date;
  entryPrice: Money;
  remainingQty: number;
  originalQty: number;
}

export class GetPnlStatementUseCase implements IGetPnlStatementUseCase {
  constructor(
    private readonly tradeRepo: ITradeRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly stockRepo: IStockRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(
    userId: string,
    query: PnlStatementQueryDTO
  ): Promise<GetPnlStatementResponseDTO> {
    const pnlView = query.pnlType ?? "COMBINED";
    const segmentRaw = query.segment ?? "ALL";
    const segmentFilter: "ALL" | "CNC" | "MIS" =
      segmentRaw === "COMBINED" || segmentRaw === "ALL"
        ? "ALL"
        : segmentRaw === "DELIVERY" || segmentRaw === "CNC"
        ? "CNC"
        : "MIS";

    // 1. Fetch historical trades up to `to` date filtered optionally by segment
    const allUserTrades = await this.tradeRepo.findByUserId(userId, {
      to: query.to,
      symbol: query.symbol,
      productType: segmentFilter !== "ALL" ? (segmentFilter as ProductType) : undefined,
    });

    // Sort chronologically (oldest first) for deterministic FIFO queue matching
    const chronologicalTrades = [...allUserTrades].sort(
      (a, b) => a.executedAt.getTime() - b.executedAt.getTime()
    );

    // 2. Fetch stock exchange lookup
    const allStocks = await this.stockRepo.findAll();
    const stockExchangeMap = new Map<string, string>();
    for (const s of allStocks) {
      stockExchangeMap.set(s.symbol, s.exchange);
    }

    // 3. Group trades by "SYMBOL:PRODUCT_TYPE" so Delivery and Intraday are isolated
    const tradesByScrip = new Map<string, Trade[]>();
    for (const t of chronologicalTrades) {
      const key = `${t.symbol.toUpperCase().trim()}:${t.productType}`;
      const list = tradesByScrip.get(key) ?? [];
      list.push(t);
      tradesByScrip.set(key, list);
    }

    // Also include open positions matching segment filter
    const activePositions = await this.positionRepo.findAllPositionsByUserId(userId);
    for (const pos of activePositions) {
      if (pos.isOpen()) {
        const matchesSegment = segmentFilter === "ALL" || pos.productType === segmentFilter;
        const matchesSymbol = !query.symbol || query.symbol.toUpperCase().trim() === pos.symbol.toUpperCase().trim();
        if (matchesSegment && matchesSymbol) {
          const key = `${pos.symbol.toUpperCase().trim()}:${pos.productType}`;
          if (!tradesByScrip.has(key)) {
            tradesByScrip.set(key, []);
          }
        }
      }
    }

    // 4. Daily Heatmap tracking (YYYY-MM-DD -> { grossPnL, netPnL, count })
    const dailyPnlMap = new Map<string, { gross: Money; net: Money; count: number }>();

    // 5. Overall Summary Accumulators
    let totalRealizedGross = Money.zero();
    let totalUnrealized = Money.zero();
    let totalBrokerage = Money.zero();
    let totalStt = Money.zero();
    let totalExchangeCharges = Money.zero();
    let totalSebiCharges = Money.zero();
    let totalStampDuty = Money.zero();
    let totalGst = Money.zero();
    let totalAllCharges = Money.zero();

    interface ScripAccumulator {
      symbol: string;
      exchange: string;
      productTypes: Set<ProductType>;
      closedQty: number;
      openQty: number;
      buyTurnover: Money;
      sellTurnover: Money;
      grossRealizedPnL: Money;
      brokerage: Money;
      stt: Money;
      exchangeCharges: Money;
      sebiCharges: Money;
      stampDuty: Money;
      gst: Money;
      totalCharges: Money;
      unrealizedPnL: Money;
      currentLtp: number;
    }

    const symbolMap = new Map<string, ScripAccumulator>();

    // 6. Execute FIFO matching per scrip ("SYMBOL:PRODUCT_TYPE")
    for (const [scripKey, trades] of tradesByScrip.entries()) {
      const [symbol, productTypeStr] = scripKey.split(":");
      const productType = productTypeStr as ProductType;
      const exchange = stockExchangeMap.get(symbol) ?? "NSE";

      const buyQueue: LotTracker[] = [];
      const sellQueue: LotTracker[] = [];

      let scripClosedQty = 0;
      let scripBuyTurnover = Money.zero();
      let scripSellTurnover = Money.zero();
      let scripGrossPnL = Money.zero();

      let scripBrokerage = Money.zero();
      let scripStt = Money.zero();
      let scripExchangeCharges = Money.zero();
      let scripSebiCharges = Money.zero();
      let scripStampDuty = Money.zero();
      let scripGst = Money.zero();
      let scripTotalCharges = Money.zero();

      for (const t of trades) {
        if (t.side === OrderSide.BUY) {
          let buyQtyRemaining = t.quantity;
          const buyPrice = t.price;
          const buyDate = t.executedAt;

          // 1. If we have open SHORT lots, this BUY covers them!
          while (buyQtyRemaining > 0 && sellQueue.length > 0) {
            const shortLot = sellQueue[0];
            const matchedQty = Math.min(shortLot.remainingQty, buyQtyRemaining);

            const lotSellValue = shortLot.entryPrice.multiply(matchedQty);
            const lotBuyValue = buyPrice.multiply(matchedQty);
            // In short trades: Profit = SellPrice - BuyPrice
            const lotGrossPnL = lotSellValue.subtract(lotBuyValue);

            const sellFraction = matchedQty / shortLot.originalQty;
            const buyFraction = matchedQty / t.quantity;

            const legBrokerage = shortLot.trade.brokerage
              .multiply(sellFraction)
              .add(t.brokerage.multiply(buyFraction));
            const legStt = shortLot.trade.stt
              .multiply(sellFraction)
              .add(t.stt.multiply(buyFraction));
            const legExchange = shortLot.trade.exchangeTurnoverCharges
              .multiply(sellFraction)
              .add(t.exchangeTurnoverCharges.multiply(buyFraction));
            const legSebi = shortLot.trade.sebiCharges
              .multiply(sellFraction)
              .add(t.sebiCharges.multiply(buyFraction));
            const legStamp = shortLot.trade.stampDuty
              .multiply(sellFraction)
              .add(t.stampDuty.multiply(buyFraction));
            const legGst = shortLot.trade.gst
              .multiply(sellFraction)
              .add(t.gst.multiply(buyFraction));
            const legTotalCharges = shortLot.trade.totalCharges
              .multiply(sellFraction)
              .add(t.totalCharges.multiply(buyFraction));

            const legNetPnL = lotGrossPnL.subtract(legTotalCharges);

            const isWithinDateRange =
              (!query.from || buyDate >= query.from) &&
              (!query.to || buyDate <= query.to);

            if (isWithinDateRange) {
              scripClosedQty += matchedQty;
              scripBuyTurnover = scripBuyTurnover.add(lotBuyValue);
              scripSellTurnover = scripSellTurnover.add(lotSellValue);
              scripGrossPnL = scripGrossPnL.add(lotGrossPnL);

              scripBrokerage = scripBrokerage.add(legBrokerage);
              scripStt = scripStt.add(legStt);
              scripExchangeCharges = scripExchangeCharges.add(legExchange);
              scripSebiCharges = scripSebiCharges.add(legSebi);
              scripStampDuty = scripStampDuty.add(legStamp);
              scripGst = scripGst.add(legGst);
              scripTotalCharges = scripTotalCharges.add(legTotalCharges);

              const dayKey = buyDate.toISOString().split("T")[0];
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

            shortLot.remainingQty -= matchedQty;
            buyQtyRemaining -= matchedQty;

            if (shortLot.remainingQty === 0) {
              sellQueue.shift();
            }
          }

          // 2. If leftover quantity remains, it opens or adds to a LONG position
          if (buyQtyRemaining > 0) {
            buyQueue.push({
              trade: t,
              entryDate: t.executedAt,
              entryPrice: t.price,
              remainingQty: buyQtyRemaining,
              originalQty: t.quantity,
            });
          }
        } else if (t.side === OrderSide.SELL) {
          let sellQtyRemaining = t.quantity;
          const sellPrice = t.price;
          const sellDate = t.executedAt;

          // 1. If we have open LONG lots, this SELL closes them!
          while (sellQtyRemaining > 0 && buyQueue.length > 0) {
            const longLot = buyQueue[0];
            const matchedQty = Math.min(longLot.remainingQty, sellQtyRemaining);

            const lotBuyValue = longLot.entryPrice.multiply(matchedQty);
            const lotSellValue = sellPrice.multiply(matchedQty);
            const lotGrossPnL = lotSellValue.subtract(lotBuyValue);

            const buyFraction = matchedQty / longLot.originalQty;
            const sellFraction = matchedQty / t.quantity;

            const legBrokerage = longLot.trade.brokerage
              .multiply(buyFraction)
              .add(t.brokerage.multiply(sellFraction));
            const legStt = longLot.trade.stt
              .multiply(buyFraction)
              .add(t.stt.multiply(sellFraction));
            const legExchange = longLot.trade.exchangeTurnoverCharges
              .multiply(buyFraction)
              .add(t.exchangeTurnoverCharges.multiply(sellFraction));
            const legSebi = longLot.trade.sebiCharges
              .multiply(buyFraction)
              .add(t.sebiCharges.multiply(sellFraction));
            const legStamp = longLot.trade.stampDuty
              .multiply(buyFraction)
              .add(t.stampDuty.multiply(sellFraction));
            const legGst = longLot.trade.gst
              .multiply(buyFraction)
              .add(t.gst.multiply(sellFraction));
            const legTotalCharges = longLot.trade.totalCharges
              .multiply(buyFraction)
              .add(t.totalCharges.multiply(sellFraction));

            const legNetPnL = lotGrossPnL.subtract(legTotalCharges);

            const isWithinDateRange =
              (!query.from || sellDate >= query.from) &&
              (!query.to || sellDate <= query.to);

            if (isWithinDateRange) {
              scripClosedQty += matchedQty;
              scripBuyTurnover = scripBuyTurnover.add(lotBuyValue);
              scripSellTurnover = scripSellTurnover.add(lotSellValue);
              scripGrossPnL = scripGrossPnL.add(lotGrossPnL);

              scripBrokerage = scripBrokerage.add(legBrokerage);
              scripStt = scripStt.add(legStt);
              scripExchangeCharges = scripExchangeCharges.add(legExchange);
              scripSebiCharges = scripSebiCharges.add(legSebi);
              scripStampDuty = scripStampDuty.add(legStamp);
              scripGst = scripGst.add(legGst);
              scripTotalCharges = scripTotalCharges.add(legTotalCharges);

              const dayKey = sellDate.toISOString().split("T")[0];
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

            longLot.remainingQty -= matchedQty;
            sellQtyRemaining -= matchedQty;

            if (longLot.remainingQty === 0) {
              buyQueue.shift();
            }
          }

          // 2. If leftover quantity remains, it opens or adds to a SHORT position
          if (sellQtyRemaining > 0) {
            sellQueue.push({
              trade: t,
              entryDate: t.executedAt,
              entryPrice: t.price,
              remainingQty: sellQtyRemaining,
              originalQty: t.quantity,
            });
          }
        }
      }

      // 7. Evaluate remaining open lots (Long in buyQueue or Short in sellQueue)
      let scripOpenQty = 0;
      let scripUnrealizedPnL = Money.zero();

      const quote = await this.marketDataService.getQuote(symbol);
      const openPosition = activePositions.find(
        (p) => p.symbol.toUpperCase().trim() === symbol && p.productType === productType && p.isOpen()
      );
      const fallbackPrice =
        buyQueue.length > 0
          ? buyQueue[0].entryPrice.toNumber()
          : sellQueue.length > 0
          ? sellQueue[0].entryPrice.toNumber()
          : openPosition?.averagePrice ?? 0;
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : fallbackPrice;
      const ltpMoney = Money.of(currentLtp);

      // Open Long lots
      for (const openLot of buyQueue) {
        if (openLot.remainingQty > 0) {
          const lotCost = openLot.entryPrice.multiply(openLot.remainingQty);
          const lotCurrent = ltpMoney.multiply(openLot.remainingQty);
          const lotUnrealized = lotCurrent.subtract(lotCost);

          scripOpenQty += openLot.remainingQty;
          scripUnrealizedPnL = scripUnrealizedPnL.add(lotUnrealized);
        }
      }

      // Open Short lots
      for (const openLot of sellQueue) {
        if (openLot.remainingQty > 0) {
          const lotSellVal = openLot.entryPrice.multiply(openLot.remainingQty);
          const lotCurrentCost = ltpMoney.multiply(openLot.remainingQty);
          const lotUnrealized = lotSellVal.subtract(lotCurrentCost);

          scripOpenQty -= openLot.remainingQty;
          scripUnrealizedPnL = scripUnrealizedPnL.add(lotUnrealized);
        }
      }

      // Accumulate into symbolMap to combine CNC & MIS into a single row per symbol
      let symbolAcc = symbolMap.get(symbol);
      if (!symbolAcc) {
        symbolAcc = {
          symbol,
          exchange,
          productTypes: new Set([productType]),
          closedQty: scripClosedQty,
          openQty: Math.abs(scripOpenQty),
          buyTurnover: scripBuyTurnover,
          sellTurnover: scripSellTurnover,
          grossRealizedPnL: scripGrossPnL,
          brokerage: scripBrokerage,
          stt: scripStt,
          exchangeCharges: scripExchangeCharges,
          sebiCharges: scripSebiCharges,
          stampDuty: scripStampDuty,
          gst: scripGst,
          totalCharges: scripTotalCharges,
          unrealizedPnL: scripUnrealizedPnL,
          currentLtp,
        };
        symbolMap.set(symbol, symbolAcc);
      } else {
        symbolAcc.productTypes.add(productType);
        symbolAcc.closedQty += scripClosedQty;
        symbolAcc.openQty += Math.abs(scripOpenQty);
        symbolAcc.buyTurnover = symbolAcc.buyTurnover.add(scripBuyTurnover);
        symbolAcc.sellTurnover = symbolAcc.sellTurnover.add(scripSellTurnover);
        symbolAcc.grossRealizedPnL = symbolAcc.grossRealizedPnL.add(scripGrossPnL);
        symbolAcc.brokerage = symbolAcc.brokerage.add(scripBrokerage);
        symbolAcc.stt = symbolAcc.stt.add(scripStt);
        symbolAcc.exchangeCharges = symbolAcc.exchangeCharges.add(scripExchangeCharges);
        symbolAcc.sebiCharges = symbolAcc.sebiCharges.add(scripSebiCharges);
        symbolAcc.stampDuty = symbolAcc.stampDuty.add(scripStampDuty);
        symbolAcc.gst = symbolAcc.gst.add(scripGst);
        symbolAcc.totalCharges = symbolAcc.totalCharges.add(scripTotalCharges);
        symbolAcc.unrealizedPnL = symbolAcc.unrealizedPnL.add(scripUnrealizedPnL);
        if (currentLtp > 0) symbolAcc.currentLtp = currentLtp;
      }

      // Accumulate overall totals
      totalRealizedGross = totalRealizedGross.add(scripGrossPnL);
      totalUnrealized = totalUnrealized.add(scripUnrealizedPnL);
      totalBrokerage = totalBrokerage.add(scripBrokerage);
      totalStt = totalStt.add(scripStt);
      totalExchangeCharges = totalExchangeCharges.add(scripExchangeCharges);
      totalSebiCharges = totalSebiCharges.add(scripSebiCharges);
      totalStampDuty = totalStampDuty.add(scripStampDuty);
      totalGst = totalGst.add(scripGst);
      totalAllCharges = totalAllCharges.add(scripTotalCharges);
    }

    // Build unified 1-row-per-symbol summaries
    const symbolSummaries: PnlSymbolSummaryDTO[] = [];
    for (const acc of symbolMap.values()) {
      const shouldInclude =
        pnlView === "REALIZED"
          ? acc.closedQty > 0
          : pnlView === "UNREALIZED"
          ? acc.openQty > 0
          : acc.closedQty > 0 || acc.openQty > 0;

      if (shouldInclude) {
        const netRealizedPnL = acc.grossRealizedPnL.subtract(acc.totalCharges);
        const buyAvg = acc.closedQty > 0 ? acc.buyTurnover.divide(acc.closedQty).toNumber() : 0;
        const sellAvg = acc.closedQty > 0 ? acc.sellTurnover.divide(acc.closedQty).toNumber() : 0;
        const productType = acc.productTypes.size === 1 ? Array.from(acc.productTypes)[0] : undefined;

        symbolSummaries.push({
          symbol: acc.symbol,
          exchange: acc.exchange,
          productType,
          quantity: acc.closedQty,
          buyAvg,
          buyValue: acc.buyTurnover.toNumber(),
          sellAvg,
          sellValue: acc.sellTurnover.toNumber(),
          grossRealizedPnL: acc.grossRealizedPnL.toNumber(),
          charges: acc.totalCharges.toNumber(),
          netRealizedPnL: netRealizedPnL.toNumber(),
          chargesBreakdown: {
            brokerage: acc.brokerage.toNumber(),
            stt: acc.stt.toNumber(),
            exchangeTurnoverCharges: acc.exchangeCharges.toNumber(),
            sebiCharges: acc.sebiCharges.toNumber(),
            stampDuty: acc.stampDuty.toNumber(),
            gst: acc.gst.toNumber(),
            totalCharges: acc.totalCharges.toNumber(),
          },
          unrealizedPnL: acc.unrealizedPnL.toNumber(),
          openQuantity: acc.openQty,
          currentLtp: acc.currentLtp,
        });
      }
    }

    // 8. Build Heatmap days and stats (based on Net Realised P&L per trade day)
    const heatmapDays: PnlHeatmapDayDTO[] = [];
    let greenDays = 0;
    let redDays = 0;
    let neutralDays = 0;

    const sortedDates = Array.from(dailyPnlMap.keys()).sort();
    for (const d of sortedDates) {
      const entry = dailyPnlMap.get(d)!;
      if (entry.net.isPositive()) greenDays++;
      else if (entry.net.isNegative()) redDays++;
      else neutralDays++;

      heatmapDays.push({
        date: d,
        grossPnL: entry.gross.toNumber(),
        netPnL: entry.net.toNumber(),
        tradesCount: entry.count,
      });
    }

    const overallNetRealized = totalRealizedGross.subtract(totalAllCharges);

    const summary: PnlSummaryDTO = {
      realizedPnL: totalRealizedGross.toNumber(),
      charges: totalAllCharges.toNumber(),
      netRealizedPnL: overallNetRealized.toNumber(),
      unrealizedPnL: totalUnrealized.toNumber(),
      chargesBreakdown: {
        brokerage: totalBrokerage.toNumber(),
        stt: totalStt.toNumber(),
        exchangeTurnoverCharges: totalExchangeCharges.toNumber(),
        sebiCharges: totalSebiCharges.toNumber(),
        stampDuty: totalStampDuty.toNumber(),
        gst: totalGst.toNumber(),
        totalCharges: totalAllCharges.toNumber(),
      },
    };

    const heatmap: PnlHeatmapSummaryDTO = {
      greenDays,
      redDays,
      neutralDays,
      days: heatmapDays,
    };

    return {
      summary,
      heatmap,
      symbols: symbolSummaries,
      fromDate: query.from,
      toDate: query.to,
      segment: segmentFilter,
    };
  }
}
