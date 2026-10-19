import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IAuthTokenService } from "../../../application/interface/services/ITokenService";
import { IUserActivityService } from "../../../application/interface/services/IUserActivityService";

export const createAuthMiddleware = (
  tokenService: IAuthTokenService,
  userActivityService?: IUserActivityService
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookies = req.cookies as Record<string, string | undefined> | undefined;
      const token = cookies?.accessToken;

      if (!token) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const decoded = tokenService.verifyAccessToken(token);
      req.user = decoded;

      if (userActivityService && decoded.userId) {
        void userActivityService.recordActivity(decoded.userId);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

 