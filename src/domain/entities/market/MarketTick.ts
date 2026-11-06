export interface MarketTick {
    symbol: string;         
    ltp: number;            
    open: number;
    high: number;
    low: number;
    close: number;          
    change: number;         
    changePercent: number;  
    volume: number;
    timestamp: number;
    atp?: number;
    bidPrice?: number | null;
    askPrice?: number | null;
    totalBuyQty?: number | null;
    totalSellQty?: number | null;
}