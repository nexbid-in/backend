import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; 

    if (!user || !allowedRoles.includes(user.role)) {
      throw new AppError(ErrorCodes.FORBIDDEN);
    }

    next();
  };
};
