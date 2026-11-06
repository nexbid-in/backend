import { env } from "../../infrastructure/config/env";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { IBrokerAuthService } from "../../application/interface/services/IBrokerAuthService";
import { FyersMarketService } from "../../infrastructure/external/market/FyersMarketService";
import { FyersAuthService } from "../../infrastructure/external/market/FyersAuthService";
import { FyersTokenRefreshCron } from "../../infrastructure/cron/FyersTokenRefreshCron";
import { MockMarketService } from "../../infrastructure/external/market/MockMarketService";
import { StockRepository } from "../../infrastructure/repositories/stock/StockRepository";
import { GetHistoricalCandlesUseCase } from "../../application/use-cases/market/GetHistoricalCandlesUseCase";
import { GetStockOverviewUseCase } from "../../application/use-cases/market/GetStockOverviewUseCase";
import { MarketController } from "../../presentation/http/controllers/market/MarketController";

export const fyersAuthService: IBrokerAuthService = new FyersAuthService();
export const fyersTokenRefreshCron = new FyersTokenRefreshCron(fyersAuthService);

export const marketDataService: IMarketDataService =
    env.MARKET_DATA_PROVIDER === "fyers"
        ? new FyersMarketService(fyersAuthService)
        : new MockMarketService();

export const stockRepository = new StockRepository();
export const getHistoricalCandlesUseCase = new GetHistoricalCandlesUseCase(marketDataService);
export const getStockOverviewUseCase = new GetStockOverviewUseCase(stockRepository, marketDataService);

export const marketController = new MarketController(
    getHistoricalCandlesUseCase,
    getStockOverviewUseCase
);