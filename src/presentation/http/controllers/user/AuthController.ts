import { Request, Response, NextFunction } from "express";

import { IRegisterUserUseCase } from "../../../../application/interface/use-cases/user/IRegisterUserUseCase";
import { IVerifyEmailAndCreateAccountUseCase } from "../../../../application/interface/use-cases/user/IVerifyEmailAndCreateAccountUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/user/IResendOtpUseCase";
import { ILoginUserUseCase } from "../../../../application/interface/use-cases/user/ILoginUserUseCase";
import { loginUserSchema } from "../../../../application/dto/request/auth/login.dto";
import { registerUserSchema, resendOtpSchema, verifyEmailSchema } from "../../../../application/dto/request/auth/register.dto";


export class AuthController {
  constructor(
    private readonly _registerUser: IRegisterUserUseCase,
    private readonly _verifyEmailAndCreateAccount: IVerifyEmailAndCreateAccountUseCase,
    private readonly _resendOtp: IResendOtpUseCase,
    private readonly _loginUser: ILoginUserUseCase,
  ) { }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      await this._registerUser.execute(validatedData);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmailAndCreateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);
      const result = await this._verifyEmailAndCreateAccount.execute(validatedData);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: SuccessMessages.REGISTRATION_COMPLETED,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = resendOtpSchema.parse(req.body);
      await this._resendOtp.execute(validatedData);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const response = await this._loginUser.execute(validatedData);

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}
