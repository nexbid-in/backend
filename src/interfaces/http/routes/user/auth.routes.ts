import express, { NextFunction, Request, Response } from "express";

import { UserRegisterSchema } from "../../../../infrastructure/services/validators/UserRegisterSchema";
import { zodValidate } from "../../../../infrastructure/middlewares/zodValidate";

import { authController } from "../../../../di/user/auth/container";
import { EmailSchema } from "../../../../infrastructure/services/validators/EmailSchema";


const router = express.Router();

router.post("/register/start", 
    zodValidate(EmailSchema), (req: Request, res: Response, next: NextFunction) => authController.startRegistrationHandler(req, res, next)
);

router.post("/register/verify-otp", 
    (req: Request, res: Response, next: NextFunction) => authController.verifyOtpHandler(req, res, next)
);

router.post("/register/resend-otp",
    zodValidate(EmailSchema), (req: Request, res: Response, next: NextFunction) => authController.resendOtpHandler(req, res, next)
);

router.post("/register/complete", 
    zodValidate(UserRegisterSchema), (req: Request, res: Response, next: NextFunction) => authController.completeRegistrationHandler(req, res, next)
);
    

export default router;