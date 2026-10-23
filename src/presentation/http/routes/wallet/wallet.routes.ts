import { Router } from "express";
import { walletController } from "../../../../di/wallet/container";
import { authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(
  ApiRoutes.WALLET.OVERVIEW,
  authMiddleware,
  walletController.getOverview.bind(walletController)
);

router.get(
  ApiRoutes.WALLET.STATEMENT,
  authMiddleware,
  walletController.getStatement.bind(walletController)
);

export default router;
