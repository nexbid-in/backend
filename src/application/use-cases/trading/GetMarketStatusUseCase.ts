import { IGetMarketStatusUseCase } from "../../interface/use-cases/trading/IGetMarketStatusUseCase";
import {
  MarketHoursService,
  MarketStatusInfo,
} from "../../services/trading/MarketHoursService";

/**
 * Returns the current exchange market session status and enforcement configuration.
 */
export class GetMarketStatusUseCase implements IGetMarketStatusUseCase {
  constructor(private readonly enforceMarketHours: boolean) {}

  execute(): MarketStatusInfo {
    return MarketHoursService.getMarketStatus(this.enforceMarketHours);
  }
}
