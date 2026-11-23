import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { IGetPnlStatementUseCase } from "../../interface/use-cases/trading/IGetPnlStatementUseCase";
import {
  PnlStatementQueryDTO,
  GetPnlStatementResponseDTO,
  PnlSymbolSummaryDTO,
  PnlTradeLotDTO,
  PnlChargesBreakdownDTO,
  PnlSummaryDTO,
} from "../../dto/trading/PnlDTOs";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Money } from "../../../domain/value-objects/Money";

export class GetPnlStatementUseCase implements IGetPnlStatementUseCase {
  constructor(
    private readonly tradeRepo: ITradeRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly marketDataService: IMarketDataService
  ) {}

  async execute(
    userId: string,
    query: PnlStatementQueryDTO
  ): Promise<GetPnlStatementResponseDTO> {
    const [trades, allPositions] = await Promise.all([
      this.tradeRepo.findByUserId(userId, {
        from: query.from,
        to: query.to,
        symbol: query.symbol,
        productType: query.productType,
      }),
      this.positionRepo.findAllPositionsByUserId(userId),
    ]);

    // Group trades by "SYMBOL:PRODUCT_TYPE"
    const tradesByScrip = new Map<string, typeof trades>();
    for (const trade of trades) {
      const key = `${trade.symbol}:${trade.productType}`;
      const list = tradesByScrip.get(key) ?? [];
      list.push(trade);
      tradesByScrip.set(key, list);
    }

    const symbolSummaries: PnlSymbolSummaryDTO[] = [];

    let totalBrokerage = Money.zero();
    let totalStt = Money.zero();
    let totalExchangeTurnoverCharges = Money.zero();
    let totalSebiCharges = Money.zero();
    let totalStampDuty = Money.zero();
    let totalGst = Money.zero();
    let totalAllCharges = Money.zero();

    let overallGrossRealizedPnL = Money.zero();
    let overallUnrealizedPnL = Money.zero();
    let profitableTrades = 0;
    let lossTrades = 0;
    let closedTradesCount = 0;

    for (const [key, scripTrades] of tradesByScrip.entries()) {
      const [symbol, productTypeStr] = key.split(":");
      const productType = productTypeStr as ProductType;

      let buyQty = 0;
      let buyAmount = Money.zero();
      let sellQty = 0;
      let sellAmount = Money.zero();
      let scripGrossRealizedPnL = Money.zero();

      let scripBrokerage = Money.zero();
      let scripStt = Money.zero();
      let scripExchangeCharges = Money.zero();
      let scripSebiCharges = Money.zero();
      let scripStampDuty = Money.zero();
      let scripGst = Money.zero();
      let scripTotalCharges = Money.zero();

      const mappedTradeLots: PnlTradeLotDTO[] = [];

      for (const t of scripTrades) {
        if (t.side === OrderSide.BUY) {
          buyQty += t.quantity;
          buyAmount = buyAmount.add(t.tradeValue);
        } else {
          sellQty += t.quantity;
          sellAmount = sellAmount.add(t.tradeValue);
        }

        scripGrossRealizedPnL = scripGrossRealizedPnL.add(t.realizedPnL);

        // Charges accumulation with Money
        scripBrokerage = scripBrokerage.add(t.brokerage);
        scripStt = scripStt.add(t.stt);
        scripExchangeCharges = scripExchangeCharges.add(t.exchangeTurnoverCharges);
        scripSebiCharges = scripSebiCharges.add(t.sebiCharges);
        scripStampDuty = scripStampDuty.add(t.stampDuty);
        scripGst = scripGst.add(t.gst);
        scripTotalCharges = scripTotalCharges.add(t.totalCharges);

        const tradeNetPnL = t.realizedPnL.subtract(t.totalCharges);

        // Win/loss metrics on closing trades
        if (!t.realizedPnL.isZero()) {
          closedTradesCount++;
          if (tradeNetPnL.isPositive()) {
            profitableTrades++;
          } else if (tradeNetPnL.isNegative()) {
            lossTrades++;
          }
        }

        mappedTradeLots.push({
          tradeId: t.id,
          orderId: t.orderId,
          symbol: t.symbol,
          side: t.side,
          productType: t.productType,
          quantity: t.quantity,
          price: t.price.toNumber(),
          tradeValue: t.tradeValue.toNumber(),
          realizedPnL: t.realizedPnL.toNumber(),
          charges: {
            brokerage: t.brokerage.toNumber(),
            stt: t.stt.toNumber(),
            exchangeTurnoverCharges: t.exchangeTurnoverCharges.toNumber(),
            sebiCharges: t.sebiCharges.toNumber(),
            stampDuty: t.stampDuty.toNumber(),
            gst: t.gst.toNumber(),
            totalCharges: t.totalCharges.toNumber(),
          },
          netPnL: tradeNetPnL.toNumber(),
          executedAt: t.executedAt,
        });
      }

      const scripNetRealizedPnL = scripGrossRealizedPnL.subtract(scripTotalCharges);
      const avgBuyPrice = buyQty > 0 ? buyAmount.divide(buyQty).toNumber() : 0;
      const avgSellPrice = sellQty > 0 ? sellAmount.divide(sellQty).toNumber() : 0;

      // Accumulate into overall totals
      overallGrossRealizedPnL = overallGrossRealizedPnL.add(scripGrossRealizedPnL);
      totalBrokerage = totalBrokerage.add(scripBrokerage);
      totalStt = totalStt.add(scripStt);
      totalExchangeTurnoverCharges = totalExchangeTurnoverCharges.add(scripExchangeCharges);
      totalSebiCharges = totalSebiCharges.add(scripSebiCharges);
      totalStampDuty = totalStampDuty.add(scripStampDuty);
      totalGst = totalGst.add(scripGst);
      totalAllCharges = totalAllCharges.add(scripTotalCharges);

      // Fetch live quote for open positions
      const openPosition = allPositions.find(
        (p) => p.symbol === symbol && p.productType === productType && p.isOpen()
      );

      let openQty = 0;
      let currentLtp = 0;
      let scripUnrealizedPnL = Money.zero();

      if (openPosition) {
        openQty = openPosition.quantity;
        const quote = await this.marketDataService.getQuote(symbol);
        currentLtp = quote?.ltp && quote.ltp > 0 ? quote.ltp : openPosition.averagePrice;
        scripUnrealizedPnL = Money.of(openPosition.calculateUnrealizedPnL(currentLtp));
        overallUnrealizedPnL = overallUnrealizedPnL.add(scripUnrealizedPnL);
      }

      const scripChargesBreakdown: PnlChargesBreakdownDTO = {
        brokerage: scripBrokerage.toNumber(),
        stt: scripStt.toNumber(),
        exchangeTurnoverCharges: scripExchangeCharges.toNumber(),
        sebiCharges: scripSebiCharges.toNumber(),
        stampDuty: scripStampDuty.toNumber(),
        gst: scripGst.toNumber(),
        totalCharges: scripTotalCharges.toNumber(),
      };

      symbolSummaries.push({
        symbol,
        productType,
        buyQty,
        buyAmount: buyAmount.toNumber(),
        avgBuyPrice,
        sellQty,
        sellAmount: sellAmount.toNumber(),
        avgSellPrice,
        grossRealizedPnL: scripGrossRealizedPnL.toNumber(),
        totalCharges: scripTotalCharges.toNumber(),
        netRealizedPnL: scripNetRealizedPnL.toNumber(),
        chargesBreakdown: scripChargesBreakdown,
        openQty,
        currentLtp,
        unrealizedPnL: scripUnrealizedPnL.toNumber(),
        trades: mappedTradeLots,
      });
    }

    const overallNetRealizedPnL = overallGrossRealizedPnL.subtract(totalAllCharges);

    const winRate =
      closedTradesCount > 0 ? +((profitableTrades / closedTradesCount) * 100).toFixed(2) : 0;

    const summaryChargesBreakdown: PnlChargesBreakdownDTO = {
      brokerage: totalBrokerage.toNumber(),
      stt: totalStt.toNumber(),
      exchangeTurnoverCharges: totalExchangeTurnoverCharges.toNumber(),
      sebiCharges: totalSebiCharges.toNumber(),
      stampDuty: totalStampDuty.toNumber(),
      gst: totalGst.toNumber(),
      totalCharges: totalAllCharges.toNumber(),
    };

    const summary: PnlSummaryDTO = {
      grossRealizedPnL: overallGrossRealizedPnL.toNumber(),
      totalCharges: totalAllCharges.toNumber(),
      netRealizedPnL: overallNetRealizedPnL.toNumber(),
      unrealizedPnL: overallUnrealizedPnL.toNumber(),
      totalTrades: trades.length,
      profitableTrades,
      lossTrades,
      winRate,
      chargesBreakdown: summaryChargesBreakdown,
    };

    return {
      summary,
      symbols: symbolSummaries,
      fromDate: query.from,
      toDate: query.to,
    };
  }
}
