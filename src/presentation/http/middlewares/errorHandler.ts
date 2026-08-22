import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { HttpErrorMap } from "../constants/HttpErrorMap";
import { HttpStatus } from "../constants/HttpStatus";
import { logger } from "../../../infrastructure/logging/logger";
import { ApiResponse } from "../utils/ApiResponse";
import { ErrorMessages } from "../constants/ErrorMessages";


function isPrismaKnownError(
  err: unknown
): err is { code: string; meta?: any } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as any).code === "string"
  );
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return ApiResponse.error(res, HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED, details);
  }

  // 2. Custom App Errors
  if (err instanceof AppError) {
    const mapping = HttpErrorMap[err.code];
    return ApiResponse.error(res, mapping.status, err.code, mapping.message);
  }

  // 3. Prisma Database Errors
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      return ApiResponse.error(res, HttpStatus.CONFLICT, ErrorCodes.EMAIL_ALREADY_EXISTS, ErrorMessages.EMAIL_ALREADY_EXISTS);
    }

    if (err.code === "P2025") {
      return ApiResponse.error(res, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, ErrorMessages.NOT_FOUND);
    }

    logger.error({ err, prismaCode: err.code }, "Prisma known error");
  }

  // 4. JWT Errors
  if (err instanceof TokenExpiredError) {
    return ApiResponse.error(res, HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, ErrorMessages.UNAUTHORIZED);
  }

  if (err instanceof JsonWebTokenError) {
    return ApiResponse.error(res, HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, ErrorMessages.UNAUTHORIZED);
  }

  // 5. Fallback for Unhandled Errors
  if (!isPrismaKnownError(err)) {
      logger.error({ err }, "Unhandled error");
  }
  return ApiResponse.error(res, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_SERVER_ERROR, ErrorMessages.INTERNAL_SERVER_ERROR);
};

