import { MarketQuote } from "../../domain/entities/market/MarketQuote";
import { MarketTick } from "../../domain/entities/market/MarketTick";

/**
 * Serializes live ticks and initial quote snapshots into the unified /ws/market-feed frame format.
 */
export function serializeMarketTickPayload(
  tick: MarketTick | MarketQuote
): string {
  return JSON.stringify({
    type: "TICK",
    symbol: tick.symbol,
    data: {
      ltp: tick.ltp,
      price: tick.ltp,
      open: tick.open,
      high: tick.high,
      low: tick.low,
      close: tick.close,
      volume: tick.volume,
      atp: tick.atp,
      bidPrice: tick.bidPrice,
      askPrice: tick.askPrice,
      totalBuyQty: tick.totalBuyQty,
      totalSellQty: tick.totalSellQty,
      timestamp: tick.timestamp,
    },
    ltp: tick.ltp,
    price: tick.ltp,
    change: tick.change,
    changePercent: tick.changePercent,
    atp: tick.atp,
    bidPrice: tick.bidPrice,
    askPrice: tick.askPrice,
    totalBuyQty: tick.totalBuyQty,
    totalSellQty: tick.totalSellQty,
  });
}
