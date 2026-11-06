import { MarketTick } from "./MarketTick";

export interface MarketQuote extends MarketTick {
  atp: number;
  lowerCircuit: number | null;
  upperCircuit: number | null;
  totalBuyQty: number | null;
  totalSellQty: number | null;
  bidPrice: number | null;
  askPrice: number | null;
}

