import express from "express";
import { adminUserController } from "../../../../di/admin/container";
import { requireRole } from "../../middlewares/roleMiddleware";
import { authMiddleware } from "../../../../di/auth/container";

const router = express.Router();

router.get(
  "/getusers",
  authMiddleware,
  requireRole(["ADMIN"]),
  adminUserController.getUsers.bind(adminUserController)
);

router.patch(
    "/users/:userId/update-status",
    authMiddleware,
    requireRole(["ADMIN"]),
    adminUserController.updateUserStatus.bind(adminUserController)
)

export default router;
