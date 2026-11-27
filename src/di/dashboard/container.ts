import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { PositionRepository } from "../../infrastructure/repositories/trading/PositionRepository";
import { TradeRepository } from "../../infrastructure/repositories/trading/TradeRepository";
import { marketQuoteBatchService } from "../market/container";
import { env } from "../../infrastructure/config/env";
import { GetDashboardOverviewUseCase } from "../../application/use-cases/dashboard/GetDashboardOverviewUseCase";
import { DashboardController } from "../../presentation/http/controllers/dashboard/DashboardController";

const userRepository = new UserRepository();
const walletRepository = new WalletRepository();
const positionRepository = new PositionRepository();
const tradeRepository = new TradeRepository();

export const getDashboardOverviewUseCase = new GetDashboardOverviewUseCase(
  userRepository,
  walletRepository,
  positionRepository,
  tradeRepository,
  marketQuoteBatchService,
  env.ENFORCE_MARKET_HOURS
);

export const dashboardController = new DashboardController(
  getDashboardOverviewUseCase
);
