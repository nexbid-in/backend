import { Router } from "express";
import { marketController } from "../../../../di/market/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(ApiRoutes.MARKET.HISTORY, marketController.getHistory.bind(marketController));

export default router;