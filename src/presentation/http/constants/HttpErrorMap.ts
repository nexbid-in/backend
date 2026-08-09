import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { HttpStatus } from "./HttpStatus";
import { ErrorMessages } from "./ErrorMessages";

export const HttpErrorMap: Record<
  ErrorCodes,
  { status: HttpStatus; message: string }
> = {
  [ErrorCodes.INVALID_EMAIL]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.INVALID_EMAIL,
  },

  [ErrorCodes.EMAIL_ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    message: ErrorMessages.EMAIL_ALREADY_EXISTS,
  },

  [ErrorCodes.OTP_INVALID]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.OTP_INVALID,
  },

  [ErrorCodes.OTP_EXPIRED]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.OTP_EXPIRED,
  },

  [ErrorCodes.FAILED_TO_SEND_OTP]: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: ErrorMessages.FAILED_TO_SEND_OTP,
  },

  [ErrorCodes.VALIDATION_FAILED]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.VALIDATION_FAILED,
  },

  [ErrorCodes.UNAUTHORIZED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: ErrorMessages.UNAUTHORIZED,
  },

  [ErrorCodes.NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: ErrorMessages.NOT_FOUND,
  },

  [ErrorCodes.OTP_TOO_MANY_ATTEMPTS]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: ErrorMessages.OTP_TOO_MANY_ATTEMPTS
  },

  [ErrorCodes.USER_ID_GENERATION_FAILED]: {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: ErrorMessages.USER_ID_GENERATION_FAILED,
  },

  [ErrorCodes.INTERNAL_SERVER_ERROR]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: ErrorMessages.INTERNAL_SERVER_ERROR,
  },

  [ErrorCodes.OTP_RATE_LIMIT_EXCEEDED]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: ErrorMessages.OTP_RATE_LIMIT_EXCEEDED,
  },

  [ErrorCodes.LOGIN_RATE_LIMIT_EXCEEDED]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: ErrorMessages.LOGIN_RATE_LIMIT_EXCEEDED,
  }
};
