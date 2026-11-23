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
  PnlFifoLegDTO,
} from "../../dto/trading/PnlDTOs";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Money } from "../../../domain/value-objects/Money";
import { Trade } from "../../../domain/entities/trading/Trade";

interface BuyLotTracker {
  trade: Trade;
  buyDate: Date;
  buyPrice: Money;
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
    const segmentFilter = query.segment ?? "ALL";

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

    const symbolSummaries: PnlSymbolSummaryDTO[] = [];

    // 6. Execute FIFO matching per scrip ("SYMBOL:PRODUCT_TYPE")
    for (const [scripKey, trades] of tradesByScrip.entries()) {
      const [symbol, productTypeStr] = scripKey.split(":");
      const productType = productTypeStr as ProductType;
      const exchange = stockExchangeMap.get(symbol) ?? "NSE";

      const buyQueue: BuyLotTracker[] = [];
      const closedLegs: PnlFifoLegDTO[] = [];
      const openLegs: PnlFifoLegDTO[] = [];

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
          buyQueue.push({
            trade: t,
            buyDate: t.executedAt,
            buyPrice: t.price,
            remainingQty: t.quantity,
            originalQty: t.quantity,
          });
        } else if (t.side === OrderSide.SELL) {
          let sellQtyRemaining = t.quantity;
          const sellPrice = t.price;
          const sellDate = t.executedAt;

          while (sellQtyRemaining > 0 && buyQueue.length > 0) {
            const buyLot = buyQueue[0];
            const matchedQty = Math.min(buyLot.remainingQty, sellQtyRemaining);

            const lotBuyValue = buyLot.buyPrice.multiply(matchedQty);
            const lotSellValue = sellPrice.multiply(matchedQty);
            const lotGrossPnL = lotSellValue.subtract(lotBuyValue);

            // Proportional charge allocation
            const buyFraction = matchedQty / buyLot.originalQty;
            const sellFraction = matchedQty / t.quantity;

            const legBrokerage = buyLot.trade.brokerage
              .multiply(buyFraction)
              .add(t.brokerage.multiply(sellFraction));
            const legStt = buyLot.trade.stt
              .multiply(buyFraction)
              .add(t.stt.multiply(sellFraction));
            const legExchange = buyLot.trade.exchangeTurnoverCharges
              .multiply(buyFraction)
              .add(t.exchangeTurnoverCharges.multiply(sellFraction));
            const legSebi = buyLot.trade.sebiCharges
              .multiply(buyFraction)
              .add(t.sebiCharges.multiply(sellFraction));
            const legStamp = buyLot.trade.stampDuty
              .multiply(buyFraction)
              .add(t.stampDuty.multiply(sellFraction));
            const legGst = buyLot.trade.gst
              .multiply(buyFraction)
              .add(t.gst.multiply(sellFraction));
            const legTotalCharges = buyLot.trade.totalCharges
              .multiply(buyFraction)
              .add(t.totalCharges.multiply(sellFraction));

            const legNetPnL = lotGrossPnL.subtract(legTotalCharges);

            const isWithinDateRange =
              (!query.from || sellDate >= query.from) &&
              (!query.to || sellDate <= query.to);

            if (isWithinDateRange) {
              const closedLeg: PnlFifoLegDTO = {
                status: "Closed",
                productType,
                buyDate: buyLot.buyDate.toISOString().split("T")[0],
                sellDate: sellDate.toISOString().split("T")[0],
                quantity: matchedQty,
                buyPrice: buyLot.buyPrice.toNumber(),
                sellPrice: sellPrice.toNumber(),
                isLtp: false,
                tradePnL: lotGrossPnL.toNumber(),
                charges: {
                  brokerage: legBrokerage.toNumber(),
                  stt: legStt.toNumber(),
                  exchangeTurnoverCharges: legExchange.toNumber(),
                  sebiCharges: legSebi.toNumber(),
                  stampDuty: legStamp.toNumber(),
                  gst: legGst.toNumber(),
                  totalCharges: legTotalCharges.toNumber(),
                },
                netPnL: legNetPnL.toNumber(),
              };

              closedLegs.push(closedLeg);

              // Accumulate scrip totals
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

              // Daily heatmap accumulation
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

            buyLot.remainingQty -= matchedQty;
            sellQtyRemaining -= matchedQty;

            if (buyLot.remainingQty === 0) {
              buyQueue.shift();
            }
          }
        }
      }

      // 7. Evaluate remaining open buy lots
      let scripOpenQty = 0;
      let scripUnrealizedPnL = Money.zero();

      const quote = await this.marketDataService.getQuote(symbol);
      const openPosition = activePositions.find(
        (p) => p.symbol.toUpperCase().trim() === symbol && p.productType === productType && p.isOpen()
      );
      const fallbackPrice =
        buyQueue.length > 0 ? buyQueue[0].buyPrice.toNumber() : openPosition?.averagePrice ?? 0;
      const currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : fallbackPrice;
      const ltpMoney = Money.of(currentLtp);

      for (const openLot of buyQueue) {
        if (openLot.remainingQty > 0) {
          const lotCost = openLot.buyPrice.multiply(openLot.remainingQty);
          const lotCurrent = ltpMoney.multiply(openLot.remainingQty);
          const lotUnrealized = lotCurrent.subtract(lotCost);

          scripOpenQty += openLot.remainingQty;
          scripUnrealizedPnL = scripUnrealizedPnL.add(lotUnrealized);

          openLegs.push({
            status: "Open",
            productType,
            buyDate: openLot.buyDate.toISOString().split("T")[0],
            sellDate: null,
            quantity: openLot.remainingQty,
            buyPrice: openLot.buyPrice.toNumber(),
            sellPrice: currentLtp,
            isLtp: true,
            tradePnL: lotUnrealized.toNumber(),
            charges: {
              brokerage: 0,
              stt: 0,
              exchangeTurnoverCharges: 0,
              sebiCharges: 0,
              stampDuty: 0,
              gst: 0,
              totalCharges: 0,
            },
            netPnL: lotUnrealized.toNumber(),
          });
        }
      }

      const scripNetRealizedPnL = scripGrossPnL.subtract(scripTotalCharges);
      const buyAvg = scripClosedQty > 0 ? scripBuyTurnover.divide(scripClosedQty).toNumber() : 0;
      const sellAvg = scripClosedQty > 0 ? scripSellTurnover.divide(scripClosedQty).toNumber() : 0;

      // Select legs based on pnlType filter
      let selectedLegs: PnlFifoLegDTO[] = [];
      if (pnlView === "REALIZED") {
        selectedLegs = closedLegs;
      } else if (pnlView === "UNREALIZED") {
        selectedLegs = openLegs;
      } else {
        selectedLegs = [...closedLegs, ...openLegs];
      }

      // Check whether this symbol should be included under the active filter
      const shouldInclude =
        pnlView === "REALIZED"
          ? scripClosedQty > 0
          : pnlView === "UNREALIZED"
          ? scripOpenQty > 0
          : scripClosedQty > 0 || scripOpenQty > 0;

      if (shouldInclude) {
        symbolSummaries.push({
          symbol,
          exchange,
          productType,
          quantity: scripClosedQty,
          buyAvg,
          buyValue: scripBuyTurnover.toNumber(),
          sellAvg,
          sellValue: scripSellTurnover.toNumber(),
          grossRealizedPnL: scripGrossPnL.toNumber(),
          charges: scripTotalCharges.toNumber(),
          netRealizedPnL: scripNetRealizedPnL.toNumber(),
          chargesBreakdown: {
            brokerage: scripBrokerage.toNumber(),
            stt: scripStt.toNumber(),
            exchangeTurnoverCharges: scripExchangeCharges.toNumber(),
            sebiCharges: scripSebiCharges.toNumber(),
            stampDuty: scripStampDuty.toNumber(),
            gst: scripGst.toNumber(),
            totalCharges: scripTotalCharges.toNumber(),
          },
          unrealizedPnL: scripUnrealizedPnL.toNumber(),
          openQuantity: scripOpenQty,
          currentLtp,
          legs: selectedLegs,
        });

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
