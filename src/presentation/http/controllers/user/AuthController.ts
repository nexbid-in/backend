import { Request, Response, NextFunction } from "express";

import { IRegisterUserUseCase } from "../../../../application/interface/use-cases/user/IRegisterUserUseCase";
import { IVerifyEmailAndCreateAccountUseCase } from "../../../../application/interface/use-cases/user/IVerifyEmailAndCreateAccountUseCase";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/user/IResendOtpUseCase";
import { ILoginUserUseCase } from "../../../../application/interface/use-cases/user/ILoginUserUseCase";
import { IGetCurrentUserUseCase } from "../../../../application/interface/use-cases/user/IGetCurrentUserUseCase";

import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { clearAuthCookies, setAuthCookies } from "../../utils/cookieUtils";
import { ApiResponse } from "../../utils/ApiResponse";
import { registerUserSchema, resendOtpSchema, verifyEmailSchema, loginUserSchema } from "../../validators/AuthValidator";


export class AuthController {
  constructor(
    private readonly _registerUser: IRegisterUserUseCase,
    private readonly _verifyEmailAndCreateAccount: IVerifyEmailAndCreateAccountUseCase,
    private readonly _resendOtp: IResendOtpUseCase,
    private readonly _loginUser: ILoginUserUseCase,
    private readonly _getCurrentUser: IGetCurrentUserUseCase
  ) { }

  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      await this._registerUser.execute(validatedData);

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.OTP_SENT);

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
      const response = await this._verifyEmailAndCreateAccount.execute(validatedData);

      setAuthCookies(res, response.accessToken);

      return ApiResponse.success(res, HttpStatus.CREATED, SuccessMessages.REGISTRATION_COMPLETED, { user: response.user });

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

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.OTP_SENT);

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

      setAuthCookies(res, response.accessToken);

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.LOGIN_SUCCESS, { user: response.user });

    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          }
        });
      }

      const response = await this._getCurrentUser.execute(req.user.userId);
      return ApiResponse.success(res, HttpStatus.OK, "User authenticated", { user: response });

    } catch (error) {
      next(error);
    }
  }

  logout(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      clearAuthCookies(res);
      return ApiResponse.success(res, HttpStatus.OK, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

}
