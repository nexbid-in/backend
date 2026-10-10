import express from "express";
import { authController } from "../../../../di/auth/container";
import { authMiddleware } from "../../middlewares/authMiddleware";


const router = express.Router();

router.post("/register", authController.register.bind(authController));

router.post("/verify-email", authController.verifyEmailAndCreateAccount.bind(authController));

router.post("/resend-otp", authController.resendOtp.bind(authController));
    
router.post("/login", authController.login.bind(authController));

router.post("/logout", authController.logout.bind(authController));

router.get("/me", authMiddleware, authController.getCurrentUser.bind(authController));

router.post("/forgot-password", authController.forgotPassword.bind(authController));

router.post("/reset-password", authController.resetPassword.bind(authController));

router.post("/refresh", authController.refreshToken.bind(authController));

export default router;
