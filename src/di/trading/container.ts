import { OrderRepository } from "../../infrastructure/repositories/trading/OrderRepository";
import { PositionRepository } from "../../infrastructure/repositories/trading/PositionRepository";
import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { StockRepository } from "../../infrastructure/repositories/stock/StockRepository";
import { marketDataService } from "../market/container";
import { OrderMatchingEngine } from "../../infrastructure/external/trading/OrderMatchingEngine";
import { PlaceOrderUseCase } from "../../application/use-cases/trading/PlaceOrderUseCase";
import { GetOrdersUseCase } from "../../application/use-cases/trading/GetOrdersUseCase";
import { CancelOrderUseCase } from "../../application/use-cases/trading/CancelOrderUseCase";
import { GetPositionsUseCase } from "../../application/use-cases/trading/GetPositionsUseCase";
import { SquareOffPositionUseCase } from "../../application/use-cases/trading/SquareOffPositionUseCase";
import { AutoSquareOffCron } from "../../infrastructure/cron/AutoSquareOffCron";
import { OrderController } from "../../presentation/http/controllers/trading/OrderController";
import { PortfolioController } from "../../presentation/http/controllers/trading/PortfolioController";

// 1. Repositories
export const orderRepository = new OrderRepository();
export const positionRepository = new PositionRepository();
export const walletRepository = new WalletRepository();
export const stockRepository = new StockRepository();

// 2. Order Matching Engine
export const orderMatchingEngine = new OrderMatchingEngine(
  orderRepository,
  positionRepository,
  walletRepository,
  marketDataService
);

// 3. Use Cases
export const placeOrderUseCase = new PlaceOrderUseCase(
  orderRepository,
  positionRepository,
  walletRepository,
  stockRepository,
  marketDataService,
  orderMatchingEngine
);

export const getOrdersUseCase = new GetOrdersUseCase(orderRepository);

export const cancelOrderUseCase = new CancelOrderUseCase(
  orderRepository,
  walletRepository
);

export const getPositionsUseCase = new GetPositionsUseCase(
  positionRepository,
  marketDataService
);

export const squareOffPositionUseCase = new SquareOffPositionUseCase(
  positionRepository,
  orderRepository,
  marketDataService,
  orderMatchingEngine
);

// 4. Crons
export const autoSquareOffCron = new AutoSquareOffCron(
  positionRepository,
  squareOffPositionUseCase
);

// 5. Controllers
export const orderController = new OrderController(
  placeOrderUseCase,
  getOrdersUseCase,
  cancelOrderUseCase
);

export const portfolioController = new PortfolioController(
  getPositionsUseCase,
  squareOffPositionUseCase
);

