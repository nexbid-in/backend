import { env } from "../../infrastructure/config/env";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { IBrokerAuthService } from "../../application/interface/services/IBrokerAuthService";
import { FyersMarketService } from "../../infrastructure/external/market/FyersMarketService";
import { FyersAuthService } from "../../infrastructure/external/market/FyersAuthService";
import { FyersTokenRefreshCron } from "../../infrastructure/cron/FyersTokenRefreshCron";
import { MockMarketService } from "../../infrastructure/external/market/MockMarketService";
import { GetHistoricalCandlesUseCase } from "../../application/use-cases/market/GetHistoricalCandlesUseCase";
import { MarketController } from "../../presentation/http/controllers/market/MarketController";

export const fyersAuthService: IBrokerAuthService = new FyersAuthService();
export const fyersTokenRefreshCron = new FyersTokenRefreshCron(fyersAuthService);

export const marketDataService: IMarketDataService =
    env.MARKET_DATA_PROVIDER === "fyers"
        ? new FyersMarketService(fyersAuthService)
        : new MockMarketService();

export const getHistoricalCandlesUseCase = new GetHistoricalCandlesUseCase(marketDataService);

export const marketController = new MarketController(getHistoricalCandlesUseCase);