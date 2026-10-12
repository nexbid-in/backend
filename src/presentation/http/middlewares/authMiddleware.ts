import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IAuthTokenService } from "../../../application/interface/services/ITokenService";

export const createAuthMiddleware = (tokenService: IAuthTokenService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;

      if (!token) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const decoded = tokenService.verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
}

 