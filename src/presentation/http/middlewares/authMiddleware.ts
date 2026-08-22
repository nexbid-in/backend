import { Request, Response, NextFunction } from "express";
import { AuthTokenService } from "../../../infrastructure/services/jwt/AuthTokenService";
import { IAuthTokenServiceInput } from "../../../application/interface/services/ITokenService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenServiceInput;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    const tokenService = new AuthTokenService();
    const decoded = tokenService.verify(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
