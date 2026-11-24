import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { PositionRepository } from "../../infrastructure/repositories/trading/PositionRepository";
import { TradeRepository } from "../../infrastructure/repositories/trading/TradeRepository";
import { marketDataService } from "../market/container";
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
  marketDataService
);

export const dashboardController = new DashboardController(
  getDashboardOverviewUseCase
);
