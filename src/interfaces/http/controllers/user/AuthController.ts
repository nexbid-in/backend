import { Request, Response, NextFunction } from "express";

import { IUserRegistrationUseCase } from "../../../../application/interface/use-cases/user/IUserRegistrationUseCase";
import { IVerifyEmailOtpUseCse } from "../../../../application/interface/use-cases/user/IVerifyEmailOtpUseCase";

import { UserRegisterDTO } from "../../../../application/dto/request/auth/register.dto";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/user/IResendOtpUseCase";
import { VerifyEmailDTO } from "../../../../application/dto/request/auth/verify-email.dto";


export class AuthController {
  constructor(
    private readonly _startRegistration: IUserRegistrationUseCase,
    private readonly _verifyEmailOtp: IVerifyEmailOtpUseCse,
    private readonly _resendOtp: IResendOtpUseCase,
  ) { }

  async startRegistrationHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dto: UserRegisterDTO = req.body;

      await this._startRegistration.execute(dto);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessages.OTP_SENT,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtpHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const dto: VerifyEmailDTO = req.body;
      const result = await this._verifyEmailOtp.execute(dto);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: SuccessMessages.REGISTRATION_COMPLETED,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resendOtpHandler(
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
