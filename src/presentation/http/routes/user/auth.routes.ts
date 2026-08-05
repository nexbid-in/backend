import express, { NextFunction, Request, Response } from "express";

import { emailSchema, userRegisterSchema } from "../../../../infrastructure/services/validators/UserRegisterSchema";
import { zodValidate } from "../../../../infrastructure/middlewares/zodValidate";

import { authController } from "../../../../di/user/auth/container";


const router = express.Router();

router.post("/register", 
    zodValidate(userRegisterSchema), (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next)
);

router.post("/verify-otp", 
    (req: Request, res: Response, next: NextFunction) => authController.verifyEmailAndCreateAccount(req, res, next)
);

router.post("/resend-otp",
    zodValidate(emailSchema), (req: Request, res: Response, next: NextFunction) => authController.resendOtp(req, res, next)
);
    

export default router;