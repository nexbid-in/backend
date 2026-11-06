export interface StockOverviewVitals {
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  atp: number;
  lowerCircuit: number | null;
  upperCircuit: number | null;
  totalBuyQty: number | null;
  totalSellQty: number | null;
  bidPrice: number | null;
  askPrice: number | null;
}

export interface StockRange52W {
  high: number;
  low: number;
}

export interface StockPerformanceReturns {
  oneWeek: number | null;
  oneMonth: number | null;
  oneYear: number | null;
}

export interface StockOverviewProps {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  type: string;
  isTradable: boolean;
  isActive: boolean;
  vitals: StockOverviewVitals;
  range52W: StockRange52W;
  performance: StockPerformanceReturns;
  lastUpdated: number;
}

export class StockOverview {
  constructor(private readonly props: StockOverviewProps) {}

  get symbol(): string { return this.props.symbol; }
  get name(): string { return this.props.name; }
  get exchange(): string { return this.props.exchange; }
  get sector(): string | null { return this.props.sector; }
  get type(): string { return this.props.type; }
  get isTradable(): boolean { return this.props.isTradable; }
  get isActive(): boolean { return this.props.isActive; }
  get vitals(): StockOverviewVitals { return this.props.vitals; }
  get range52W(): StockRange52W { return this.props.range52W; }
  get performance(): StockPerformanceReturns { return this.props.performance; }
  get lastUpdated(): number { return this.props.lastUpdated; }

  toJSON(): StockOverviewProps {
    return { ...this.props };
  }
}

