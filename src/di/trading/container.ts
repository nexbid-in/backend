import { OrderRepository } from "../../infrastructure/repositories/trading/OrderRepository";
import { PositionRepository } from "../../infrastructure/repositories/trading/PositionRepository";
import { TradeRepository } from "../../infrastructure/repositories/trading/TradeRepository";
import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { StockRepository } from "../../infrastructure/repositories/stock/StockRepository";
import { marketDataService, marketQuoteBatchService } from "../market/container";
import { OrderMatchingEngine } from "../../infrastructure/external/trading/OrderMatchingEngine";
import { TradeValidationService } from "../../application/services/trading/TradeValidationService";
import { OrderPricingService } from "../../application/services/trading/OrderPricingService";
import { OrderMarginService } from "../../application/services/trading/OrderMarginService";
import { OrderExecutionService } from "../../application/services/trading/OrderExecutionService";
import { OrderRejectionService } from "../../application/services/trading/OrderRejectionService";
import { env } from "../../infrastructure/config/env";
import { HttpErrorMap } from "../../presentation/http/constants/HttpErrorMap";
import { PlaceOrderUseCase } from "../../application/use-cases/trading/PlaceOrderUseCase";
import { GetOrdersUseCase } from "../../application/use-cases/trading/GetOrdersUseCase";
import { GetMarketStatusUseCase } from "../../application/use-cases/trading/GetMarketStatusUseCase";
import { CancelOrderUseCase } from "../../application/use-cases/trading/CancelOrderUseCase";
import { GetPositionsUseCase } from "../../application/use-cases/trading/GetPositionsUseCase";
import { GetHoldingsUseCase } from "../../application/use-cases/trading/GetHoldingsUseCase";
import { GetPnlStatementUseCase } from "../../application/use-cases/trading/GetPnlStatementUseCase";
import { GetTradebookUseCase } from "../../application/use-cases/trading/GetTradebookUseCase";
import { SquareOffPositionUseCase } from "../../application/use-cases/trading/SquareOffPositionUseCase";
import { AutoSquareOffCron } from "../../infrastructure/cron/AutoSquareOffCron";
import { AmoDispatchCron } from "../../infrastructure/cron/AmoDispatchCron";
import { EodOrderExpiryCron } from "../../infrastructure/cron/EodOrderExpiryCron";
import { OrderController } from "../../presentation/http/controllers/trading/OrderController";
import { PortfolioController } from "../../presentation/http/controllers/trading/PortfolioController";
import { BusinessIdGenerator } from "../../infrastructure/services/idGenerator/BusinessIdGenerator";

export const orderRepository = new OrderRepository();
export const positionRepository = new PositionRepository();
export const tradeRepository = new TradeRepository();
export const walletRepository = new WalletRepository();
export const stockRepository = new StockRepository();
export const idGenerator = new BusinessIdGenerator();

export const orderMatchingEngine = new OrderMatchingEngine(
  orderRepository,
  positionRepository,
  tradeRepository,
  walletRepository,
  marketDataService
);

export const tradeValidationService = new TradeValidationService(
  stockRepository,
  positionRepository
);

export const orderPricingService = new OrderPricingService(
  marketDataService
);

export const orderMarginService = new OrderMarginService(
  positionRepository,
  walletRepository
);

export const orderExecutionService = new OrderExecutionService(
  orderMatchingEngine,
  marketDataService
);

export const orderRejectionService = new OrderRejectionService(
  orderRepository,
  orderMarginService,
  idGenerator,
  {
    resolve: (code) => HttpErrorMap[code]?.message,
  }
);

export const placeOrderUseCase = new PlaceOrderUseCase(
  orderRepository,
  stockRepository,
  tradeValidationService,
  orderPricingService,
  orderMarginService,
  orderExecutionService,
  orderRejectionService,
  idGenerator,
  env.ENFORCE_MARKET_HOURS
);

export const getOrdersUseCase = new GetOrdersUseCase(orderRepository);

export const cancelOrderUseCase = new CancelOrderUseCase(
  orderRepository,
  walletRepository,
  orderMatchingEngine
);

export const getPositionsUseCase = new GetPositionsUseCase(
  positionRepository,
  tradeRepository,
  marketQuoteBatchService
);

export const squareOffPositionUseCase = new SquareOffPositionUseCase(
  positionRepository,
  orderRepository,
  tradeRepository,
  orderPricingService,
  orderExecutionService,
  idGenerator,
  env.ENFORCE_MARKET_HOURS
);

export const autoSquareOffCron = new AutoSquareOffCron(
  positionRepository,
  squareOffPositionUseCase
);

export const amoDispatchCron = new AmoDispatchCron(
  orderRepository,
  marketDataService,
  orderMatchingEngine
);

export const eodOrderExpiryCron = new EodOrderExpiryCron(
  orderRepository,
  walletRepository,
  orderMatchingEngine
);

export const getMarketStatusUseCase = new GetMarketStatusUseCase(
  env.ENFORCE_MARKET_HOURS
);

export const orderController = new OrderController(
  placeOrderUseCase,
  getOrdersUseCase,
  cancelOrderUseCase,
  getMarketStatusUseCase
);

export const getHoldingsUseCase = new GetHoldingsUseCase(
  positionRepository,
  marketQuoteBatchService
);

export const getPnlStatementUseCase = new GetPnlStatementUseCase(
  tradeRepository,
  positionRepository,
  stockRepository,
  marketDataService
);

export const getTradebookUseCase = new GetTradebookUseCase(
  tradeRepository,
  stockRepository
);

export const portfolioController = new PortfolioController(
  getPositionsUseCase,
  getHoldingsUseCase,
  squareOffPositionUseCase,
  getPnlStatementUseCase,
  getTradebookUseCase
);

