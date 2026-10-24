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

router.post(
  ApiRoutes.WALLET.CREATE_ORDER,
  authMiddleware,
  walletController.createTopupOrder.bind(walletController)
);

router.post(
  ApiRoutes.WALLET.VERIFY_PAYMENT,
  authMiddleware,
  walletController.verifyTopupPayment.bind(walletController)
);

export default router;
