import { Router } from "express";
import { stockController } from "../../../../di/watchlist/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.STOCKS.SEARCH,
  authMiddleware,
  stockController.search.bind(stockController)
);

export default router;
