import { Router } from "express";
import { portfolioController } from "../../../../di/trading/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.PORTFOLIO.POSITIONS,
  authMiddleware,
  portfolioController.getPositions.bind(portfolioController)
);

router.post(
  ApiRoutes.PORTFOLIO.SQUARE_OFF,
  authMiddleware,
  portfolioController.squareOffPosition.bind(portfolioController)
);

export default router;

