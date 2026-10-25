import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { HttpErrorMap } from "../constants/HttpErrorMap";
import { HttpStatus } from "../constants/HttpStatus";
import { logger } from "../../../infrastructure/logging/logger";
import { ApiResponse } from "../utils/ApiResponse";
import { ErrorMessages } from "../constants/ErrorMessages";
import { clearAuthCookies } from "../utils/cookieUtils";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {

  // 1. Catch Malformed JSON Payload Errors
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    return ApiResponse.error(
      res,
      HttpStatus.BAD_REQUEST,
      ErrorCodes.INVALID_JSON,
      ErrorMessages.INVALID_JSON
    );
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return ApiResponse.error(res, HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_FAILED, ErrorMessages.VALIDATION_FAILED, details);
  }

  // 3. Custom App Errors
  if (err instanceof AppError) {
    if (err.code === ErrorCodes.ACCOUNT_BLOCKED) {
      clearAuthCookies(res);
    }
    
    const mapping = HttpErrorMap[err.code];
    return ApiResponse.error(res, mapping.status, err.code, mapping.message);
  }

  // 6. Fallback for Unhandled Errors
  logger.error({ err }, "Unhandled error");

  return ApiResponse.error(res, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_SERVER_ERROR, ErrorMessages.INTERNAL_SERVER_ERROR);
};

