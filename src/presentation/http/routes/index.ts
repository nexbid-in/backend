import { Router } from "express";
import AuthRoutes from "./auth/auth.routes";
import AdminRoutes from "./admin/admin.routes";
import UserRoutes from "./user/user.routes";
import { ApiRoutes } from "../constants/ApiRoutes";

const router = Router();

router.use(ApiRoutes.AUTH.BASE, AuthRoutes);
router.use(ApiRoutes.ADMIN.BASE, AdminRoutes);
router.use(ApiRoutes.USER.BASE, UserRoutes);

export default router;