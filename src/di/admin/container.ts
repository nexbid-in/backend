import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { AdminOrderQueryRepository } from "../../infrastructure/repositories/admin/AdminOrderQueryRepository";
import { AdminStockQueryRepository } from "../../infrastructure/repositories/admin/AdminStockQueryRepository";
import { GetUsersUseCase } from "../../application/use-cases/admin/GetUsersUseCase";
import { AdminUserController } from "../../presentation/http/controllers/admin/AdminUserController";
import { UpdateUserStatusUseCase } from "../../application/use-cases/admin/UpdateUserStatusUseCase";
import {
  orderRepository,
  orderCancellationService,
  stockRepository,
} from "../trading/container";
import { marketDataService } from "../market/container";
import { GetAdminOrdersUseCase } from "../../application/use-cases/admin/GetAdminOrdersUseCase";
import { GetAdminOrderMetricsUseCase } from "../../application/use-cases/admin/GetAdminOrderMetricsUseCase";
import { GetAdminOrderDetailsUseCase } from "../../application/use-cases/admin/GetAdminOrderDetailsUseCase";
import { AdminCancelOrderUseCase } from "../../application/use-cases/admin/AdminCancelOrderUseCase";
import { AdminOrderController } from "../../presentation/http/controllers/admin/AdminOrderController";
import { MarketSymbolRegistry } from "../../infrastructure/external/market/MarketSymbolRegistry";
import { StockFeedVerificationService } from "../../application/services/admin/StockFeedVerificationService";
import { GetAdminStocksUseCase } from "../../application/use-cases/admin/GetAdminStocksUseCase";
import { CreateStockUseCase } from "../../application/use-cases/admin/CreateStockUseCase";
import { UpdateStockStatusUseCase } from "../../application/use-cases/admin/UpdateStockStatusUseCase";
import { UpdateStockUseCase } from "../../application/use-cases/admin/UpdateStockUseCase";
import { DeleteStockUseCase } from "../../application/use-cases/admin/DeleteStockUseCase";
import { VerifyStockSymbolUseCase } from "../../application/use-cases/admin/VerifyStockSymbolUseCase";
import { AdminStockController } from "../../presentation/http/controllers/admin/AdminStockController";

const userRepository = new UserRepository();
const getUsersUseCase = new GetUsersUseCase(userRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);

export const adminUserController = new AdminUserController(
  getUsersUseCase,
  updateUserStatusUseCase
);

const adminOrderQueryRepository = new AdminOrderQueryRepository();
const getAdminOrdersUseCase = new GetAdminOrdersUseCase(adminOrderQueryRepository);
const getAdminOrderMetricsUseCase = new GetAdminOrderMetricsUseCase(adminOrderQueryRepository);
const getAdminOrderDetailsUseCase = new GetAdminOrderDetailsUseCase(adminOrderQueryRepository);
const adminCancelOrderUseCase = new AdminCancelOrderUseCase(
  orderRepository,
  orderCancellationService
);

export const adminOrderController = new AdminOrderController(
  getAdminOrdersUseCase,
  getAdminOrderMetricsUseCase,
  getAdminOrderDetailsUseCase,
  adminCancelOrderUseCase
);

const marketSymbolRegistry = new MarketSymbolRegistry();
const stockFeedVerificationService = new StockFeedVerificationService(
  stockRepository,
  marketDataService,
  marketSymbolRegistry
);

const adminStockQueryRepository = new AdminStockQueryRepository();
const getAdminStocksUseCase = new GetAdminStocksUseCase(adminStockQueryRepository);
const createStockUseCase = new CreateStockUseCase(
  stockRepository,
  stockFeedVerificationService,
  marketSymbolRegistry
);
const updateStockStatusUseCase = new UpdateStockStatusUseCase(stockRepository);
const updateStockUseCase = new UpdateStockUseCase(
  stockRepository,
  stockFeedVerificationService,
  marketSymbolRegistry
);
const deleteStockUseCase = new DeleteStockUseCase(
  stockRepository,
  marketSymbolRegistry
);
const verifyStockSymbolUseCase = new VerifyStockSymbolUseCase(
  stockFeedVerificationService
);

export const adminStockController = new AdminStockController(
  getAdminStocksUseCase,
  createStockUseCase,
  updateStockStatusUseCase,
  updateStockUseCase,
  deleteStockUseCase,
  verifyStockSymbolUseCase
);
