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
}