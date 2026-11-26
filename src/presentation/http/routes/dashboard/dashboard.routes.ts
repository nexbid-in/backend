import { Router } from "express";
import { dashboardController } from "../../../../di/dashboard/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.DASHBOARD.OVERVIEW,
  authMiddleware,
  dashboardController.getOverview.bind(dashboardController)
);

export default router;
