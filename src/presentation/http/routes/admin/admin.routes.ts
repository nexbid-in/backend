import express from "express";
import { adminUserController } from "../../../../di/admin/container";
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
)

export default router;
