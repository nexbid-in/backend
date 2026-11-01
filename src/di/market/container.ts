import { env } from "../../infrastructure/config/env";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { FyersMarketService } from "../../infrastructure/external/market/FyersMarketService";
import { MockMarketService } from "../../infrastructure/external/market/MockMarketService";
import { GetHistoricalCandlesUseCase } from "../../application/use-cases/market/GetHistoricalCandlesUseCase";
import { MarketController } from "../../presentation/http/controllers/market/MarketController";

export const marketDataService: IMarketDataService =
    env.MARKET_DATA_PROVIDER === "fyers"
        ? new FyersMarketService()
        : new MockMarketService();

export const getHistoricalCandlesUseCase = new GetHistoricalCandlesUseCase(marketDataService);

export const marketController = new MarketController(getHistoricalCandlesUseCase);