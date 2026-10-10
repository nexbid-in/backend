import { Request, Response, NextFunction } from "express";
import { AuthTokenService } from "../../../infrastructure/services/jwt/AuthTokenService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    const tokenService = new AuthTokenService();
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
