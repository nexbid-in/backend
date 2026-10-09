import { Request, Response, NextFunction } from "express";

import { IRegisterUserUseCase } from "../../../../application/interface/use-cases/auth/IRegisterUserUseCase";
import { IVerifyEmailAndCreateAccountUseCase } from "../../../../application/interface/use-cases/auth/IVerifyEmailAndCreateAccountUseCase";
import { IResendOtpUseCase } from "../../../../application/interface/use-cases/auth/IResendOtpUseCase";
import { ILoginUserUseCase } from "../../../../application/interface/use-cases/auth/ILoginUserUseCase";
import { IGetCurrentUserUseCase } from "../../../../application/interface/use-cases/auth/IGetCurrentUserUseCase";
import { ISendPasswordResetOtpUseCase } from "../../../../application/interface/use-cases/auth/ISendPasswordResetOtpUseCase";
import { IVerifyOtpAndResetPasswordUseCase } from "../../../../application/interface/use-cases/auth/IVerifyOtpAndResetPasswordUseCase";
import { IRefreshTokenUseCase } from "../../../../application/interface/use-cases/auth/IRefreshTokenUseCase";

import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { clearAuthCookies, setAuthCookies } from "../../utils/cookieUtils";
import { ApiResponse } from "../../utils/ApiResponse";
import { registerUserSchema, resendOtpSchema, verifyEmailSchema, loginUserSchema, forgotPasswordSchema, resetPasswordSchema } from "../../validators/AuthValidator";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";


export class AuthController {
  constructor(
    private readonly _registerUser: IRegisterUserUseCase,
    private readonly _verifyEmailAndCreateAccount: IVerifyEmailAndCreateAccountUseCase,
    private readonly _resendOtp: IResendOtpUseCase,
    private readonly _loginUser: ILoginUserUseCase,
    private readonly _getCurrentUser: IGetCurrentUserUseCase,
    private readonly _sendPasswordResetOtp: ISendPasswordResetOtpUseCase,
    private readonly _verifyOtpAndResetPassword: IVerifyOtpAndResetPasswordUseCase,
    private readonly _refreshToken: IRefreshTokenUseCase,
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

      setAuthCookies(res, response.accessToken, response.refreshToken);

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

      setAuthCookies(res, response.accessToken, response.refreshToken);

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
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const response = await this._getCurrentUser.execute(req.user.userId);
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.USER_AUTHENTICATED, { user: response });

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
      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      await this._sendPasswordResetOtp.execute(validatedData);

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.OTP_SENT);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      await this._verifyOtpAndResetPassword.execute(validatedData);

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.PASSWORD_RESET_SUCCESS);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(
    req: Request,
    res: Response, 
    next: NextFunction
  ) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const response = await this._refreshToken.execute({ refreshToken: token });

      setAuthCookies(res, response.accessToken, response.refreshToken);

      return ApiResponse.success(res, HttpStatus.OK, "Token refreshed successfully");
    } catch (error) {
      next(error);
    }
  }
}
