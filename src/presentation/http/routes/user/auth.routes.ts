import express, { NextFunction, Request, Response } from "express";
import { authController } from "../../../../di/user/auth/container";
import { authMiddleware } from "../../middlewares/authMiddleware";


const router = express.Router();

router.post("/register", authController.register.bind(authController));

router.post("/verify-otp", authController.verifyEmailAndCreateAccount.bind(authController));

router.post("/resend-otp", authController.resendOtp.bind(authController));
    
router.post("/login", authController.login.bind(authController));

router.get("/me", authMiddleware, authController.getCurrentUser.bind(authController));

export default router;