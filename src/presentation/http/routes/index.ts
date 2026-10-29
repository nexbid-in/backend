import { Router } from "express";
import { ApiRoutes } from "../constants/ApiRoutes";

import AuthRoutes from "./auth/auth.routes";
import AdminRoutes from "./admin/admin.routes";
import UserRoutes from "./user/user.routes";
import WalletRoutes from "./wallet/wallet.routes";
import StockRoutes from "./stock/stock.routes";
import WatchlistRoutes from "./watchlist/watchlist.routes";

const router = Router();

router.use(ApiRoutes.AUTH.BASE, AuthRoutes);
router.use(ApiRoutes.ADMIN.BASE, AdminRoutes);
router.use(ApiRoutes.USER.BASE, UserRoutes);
router.use(ApiRoutes.WALLET.BASE, WalletRoutes);
router.use(ApiRoutes.STOCKS.BASE, StockRoutes);
router.use(ApiRoutes.WATCHLIST.BASE, WatchlistRoutes);

export default router;