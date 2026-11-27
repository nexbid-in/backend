import { MarketStatusInfo } from "../../../services/trading/MarketHoursService";

export interface IGetMarketStatusUseCase {
  execute(): MarketStatusInfo;
}
