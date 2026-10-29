import { Router } from "express";
import { watchlistController } from "../../../../di/watchlist/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.WATCHLIST.ROOT,
  authMiddleware,
  watchlistController.getWatchlist.bind(watchlistController)
);

router.post(
  ApiRoutes.WATCHLIST.ROOT,
  authMiddleware,
  watchlistController.addToWatchlist.bind(watchlistController)
);

router.delete(
  ApiRoutes.WATCHLIST.ITEM,
  authMiddleware,
  watchlistController.removeFromWatchlist.bind(watchlistController)
);

export default router;
