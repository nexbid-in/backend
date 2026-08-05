import { Request, Response, NextFunction } from "express";

import { IRegisterUserUseCase } from "../../../../application/interface/use-cases/user/IRegisterUserUseCase";
import { IVerifyEmailAndCreateAccountUseCase } from "../../../../application/interface/use-cases/user/IVerifyEmailAndCreateAccountUseCase";

import { RegisterUserDTO } from "../../../../application/dto/request/auth/register.dto";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/user/IResendOtpUseCase";
import { VerifyEmailDTO } from "../../../../application/dto/request/auth/verify-email.dto";


export class AuthController {
  constructor(
    private readonly _registerUser: IRegisterUserUseCase,
    private readonly _verifyEmailAndCreateAccount: IVerifyEmailAndCreateAccountUseCase,
    private readonly _resendOtp: IResendOtpUseCase,
  ) { }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dto: RegisterUserDTO = req.body;

      await this._registerUser.execute(dto);

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
      const dto: VerifyEmailDTO = req.body;
      const result = await this._verifyEmailAndCreateAccount.execute(dto);

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
      await this._resendOtp.execute({
        email: req.body.email,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT,
      });
    } catch (err) {
      next(err);
    }
  }
}
