import express from "express";
import { adminUserController } from "../../../../di/admin/container";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { requireRole } from "../../middlewares/roleMiddleware";

const router = express.Router();

router.get(
  "/getusers",
  authMiddleware,
  requireRole(["ADMIN"]),
  adminUserController.getUsers.bind(adminUserController)
);

export default router;
