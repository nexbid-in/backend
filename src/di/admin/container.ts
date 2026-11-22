import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUsersUseCase } from "../../application/use-cases/admin/GetUsersUseCase";
import { AdminUserController } from "../../presentation/http/controllers/admin/AdminUserController";
import { UpdateUserStatusUseCase } from "../../application/use-cases/admin/UpdateUserStatusUseCase";
import {
  orderRepository,
  walletRepository,
  orderMatchingEngine,
  stockRepository,
} from "../trading/container";
import { GetAdminOrdersUseCase } from "../../application/use-cases/admin/GetAdminOrdersUseCase";
import { GetAdminOrderMetricsUseCase } from "../../application/use-cases/admin/GetAdminOrderMetricsUseCase";
import { GetAdminOrderDetailsUseCase } from "../../application/use-cases/admin/GetAdminOrderDetailsUseCase";
import { AdminCancelOrderUseCase } from "../../application/use-cases/admin/AdminCancelOrderUseCase";
import { AdminOrderController } from "../../presentation/http/controllers/admin/AdminOrderController";
import { GetAdminStocksUseCase } from "../../application/use-cases/admin/GetAdminStocksUseCase";
import { CreateStockUseCase } from "../../application/use-cases/admin/CreateStockUseCase";
import { UpdateStockStatusUseCase } from "../../application/use-cases/admin/UpdateStockStatusUseCase";
import { UpdateStockUseCase } from "../../application/use-cases/admin/UpdateStockUseCase";
import { DeleteStockUseCase } from "../../application/use-cases/admin/DeleteStockUseCase";
import { AdminStockController } from "../../presentation/http/controllers/admin/AdminStockController";

const userRepository = new UserRepository();
const getUsersUseCase = new GetUsersUseCase(userRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);

export const adminUserController = new AdminUserController(
  getUsersUseCase,
  updateUserStatusUseCase
);

const getAdminOrdersUseCase = new GetAdminOrdersUseCase(orderRepository);
const getAdminOrderMetricsUseCase = new GetAdminOrderMetricsUseCase(orderRepository);
const getAdminOrderDetailsUseCase = new GetAdminOrderDetailsUseCase(orderRepository);
const adminCancelOrderUseCase = new AdminCancelOrderUseCase(
  orderRepository,
  walletRepository,
  orderMatchingEngine
);

export const adminOrderController = new AdminOrderController(
  getAdminOrdersUseCase,
  getAdminOrderMetricsUseCase,
  getAdminOrderDetailsUseCase,
  adminCancelOrderUseCase
);

const getAdminStocksUseCase = new GetAdminStocksUseCase(stockRepository);
const createStockUseCase = new CreateStockUseCase(stockRepository);
const updateStockStatusUseCase = new UpdateStockStatusUseCase(stockRepository);
const updateStockUseCase = new UpdateStockUseCase(stockRepository);
const deleteStockUseCase = new DeleteStockUseCase(stockRepository);

export const adminStockController = new AdminStockController(
  getAdminStocksUseCase,
  createStockUseCase,
  updateStockStatusUseCase,
  updateStockUseCase,
  deleteStockUseCase
);
