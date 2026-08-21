import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constants/HttpStatus";
import { AuthTokenService } from "../../../infrastructure/services/jwt/AuthTokenService";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No authentication token provided",
        },
      });
    }

    const tokenService = new AuthTokenService();
    const decoded = tokenService.verify(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      },
    });
  }
};
