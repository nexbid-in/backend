import express from "express";
import {
  adminUserController,
  adminOrderController,
} from "../../../../di/admin/container";
import { requireRole } from "../../middlewares/roleMiddleware";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = express.Router();

router.get(
  ApiRoutes.ADMIN.USERS,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminUserController.getUsers.bind(adminUserController)
);

router.patch(
  ApiRoutes.ADMIN.UPDATE_USER_STATUS,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminUserController.updateUserStatus.bind(adminUserController)
);

router.get(
  ApiRoutes.ADMIN.ORDER_METRICS,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminOrderController.getMetrics.bind(adminOrderController)
);

router.get(
  ApiRoutes.ADMIN.ORDERS,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminOrderController.getOrders.bind(adminOrderController)
);

router.post(
  ApiRoutes.ADMIN.CANCEL_ORDER,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminOrderController.cancelOrder.bind(adminOrderController)
);

router.get(
  ApiRoutes.ADMIN.ORDER_DETAILS,
  authMiddleware,
  requireRole(["ADMIN"]),
  adminOrderController.getOrderDetails.bind(adminOrderController)
);

export default router;
