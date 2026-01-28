import { Request, Response, NextFunction } from "express";

import { IStartEmailRegistrationUseCase } from "../../../../application/interface/use-cases/user/IStartEmailRegistrationUseCase";
import { IVerifyEmailOtpUseCse } from "../../../../application/interface/use-cases/user/IVerifyEmailOtpUseCase";
import { ICompleteRegistrationUseCase } from "../../../../application/interface/use-cases/user/ICompleteRegistrationUseCase";

import { UserRegisterDTO } from "../../../../application/dto/request/auth/register.dto";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/user/IResendOtpUseCase";


export class AuthController {
  constructor(
    private readonly _startRegistration: IStartEmailRegistrationUseCase,
    private readonly _verifyEmailOtp: IVerifyEmailOtpUseCse,
    private readonly _resendOtp: IResendOtpUseCase,
    private readonly _completeRegistration: ICompleteRegistrationUseCase
  ) {}

  async startRegistrationHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await this._startRegistration.execute({
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

  async verifyOtpHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await this._verifyEmailOtp.execute({
        email: req.body.email,
        otp: req.body.otp,
      });

      return res.status(HttpStatus.OK).json({
        success: true,
        message: SuccessMessages.OTP_VERIFIED,
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

  async completeRegistrationHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError(
          ErrorCodes.REGISTRATION_TOKEN_MISSING
        );
      }

      const [type, token] = authHeader.split(" ");

      if (type !== "Bearer" || !token) {
        throw new AppError(
          ErrorCodes.INVALID_REGISTRATION_TOKEN
        );
      }

      const dto: UserRegisterDTO = {
        registrationToken: token,
        fullName: req.body.fullName,
        dob: req.body.dob,
        mobile: req.body.mobile,
        pin: req.body.pin,
      };

      const result =
        await this._completeRegistration.execute(dto);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: SuccessMessages.REGISTRATION_COMPLETED,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
