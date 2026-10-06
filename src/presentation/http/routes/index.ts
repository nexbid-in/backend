import { Router } from "express";
import AuthRoutes from "./auth/auth.routes";
import AdminRoutes from "./admin/admin.routes";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/admin", AdminRoutes);

export default router;