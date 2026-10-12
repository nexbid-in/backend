import { Router } from "express";
import AuthRoutes from "./auth/auth.routes";
import AdminRoutes from "./admin/admin.routes";
import { ApiRoutes } from "../constants/ApiRoutes";

const router = Router();

router.use(ApiRoutes.AUTH.BASE, AuthRoutes);
router.use(ApiRoutes.ADMIN.BASE, AdminRoutes);

export default router;