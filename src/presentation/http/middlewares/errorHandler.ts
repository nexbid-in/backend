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
  
  if (err instanceof ZodError) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_FAILED,
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

 
  if (err instanceof AppError) {
    const mapping = HttpErrorMap[err.code];

    return res.status(mapping.status).json({
      success: false,
      error: {
        code: err.code,
        message: mapping.message,
      },
    });
  }

  
  if (isPrismaKnownError(err)) {
    // Unique constraint
    if (err.code === "P2002") {
      return res.status(HttpStatus.CONFLICT).json({
        success: false,
        error: {
          code: ErrorCodes.USER_ALREADY_EXISTS,
          message: "Unique constraint violation",
        },
      });
    }

    // Record not found
    if (err.code === "P2025") {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: "Record not found",
        },
      });
    }

    logger.error(
      { err, prismaCode: err.code },
      "Prisma known error"
    );

    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: "Database error",
        },
      });
  }

 
  if (err instanceof TokenExpiredError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: "Token expired",
      },
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: "Invalid token",
      },
    });
  }

  
  logger.error({ err }, "Unhandled error");

  return res
    .status(HttpStatus.INTERNAL_SERVER_ERROR)
    .json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: "Something went wrong",
      },
    });
};
