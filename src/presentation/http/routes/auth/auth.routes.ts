import express from "express";
import { authController, authMiddleware } from "../../../../di/auth/container";
import { ApiRoutes } from "../../constants/ApiRoutes";


const router = express.Router();

router.post(ApiRoutes.AUTH.REGISTER, authController.register.bind(authController));

router.post(ApiRoutes.AUTH.VERIFY_EMAIL, authController.verifyEmailAndCreateAccount.bind(authController));

router.post(ApiRoutes.AUTH.RESEND_OTP, authController.resendOtp.bind(authController));
    
router.post(ApiRoutes.AUTH.LOGIN, authController.login.bind(authController));

router.post(ApiRoutes.AUTH.LOGOUT, authController.logout.bind(authController));

router.post(ApiRoutes.AUTH.FORGOT_PASSWORD, authController.forgotPassword.bind(authController));

router.post(ApiRoutes.AUTH.RESET_PASSWORD, authController.resetPassword.bind(authController));

router.post(ApiRoutes.AUTH.REFRESH, authController.refreshToken.bind(authController));

router.get(ApiRoutes.AUTH.ME, authMiddleware, authController.getCurrentUser.bind(authController));

router.post(ApiRoutes.AUTH.GOOGLE, authController.googleAuth.bind(authController));

export default router;
