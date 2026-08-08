import { Router } from "express";
import AuthRoutes from "./user/auth.routes";

const router = Router();

router.use("/auth", AuthRoutes);

export default router;