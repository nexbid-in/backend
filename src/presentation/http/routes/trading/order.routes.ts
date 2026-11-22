import { Router } from "express";
import { orderController } from "../../../../di/trading/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.post(
  ApiRoutes.ORDERS.ROOT,
  authMiddleware,
  orderController.placeOrder.bind(orderController)
);

router.get(
  ApiRoutes.ORDERS.ROOT,
  authMiddleware,
  orderController.getOrders.bind(orderController)
);

router.get(
  ApiRoutes.ORDERS.MARKET_STATUS,
  authMiddleware,
  orderController.getMarketStatus.bind(orderController)
);

router.delete(
  ApiRoutes.ORDERS.ITEM,
  authMiddleware,
  orderController.cancelOrder.bind(orderController)
);

export default router;

