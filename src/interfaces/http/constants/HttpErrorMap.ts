import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { HttpStatus } from "./HttpStatus";
import { ErrorMessages } from "./ErrorMessages";

export const HttpErrorMap: Record<
  ErrorCodes,
  { status: HttpStatus; message: string }
> = {
  [ErrorCodes.REGISTRATION_TOKEN_MISSING]: {
    status: HttpStatus.UNAUTHORIZED,
    message: ErrorMessages.REGISTRATION_TOKEN_MISSING,
  },

  [ErrorCodes.INVALID_REGISTRATION_TOKEN]: {
    status: HttpStatus.UNAUTHORIZED,
    message: ErrorMessages.INVALID_REGISTRATION_TOKEN,
  },

  [ErrorCodes.INVALID_EMAIL]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.INVALID_EMAIL,
  },

  [ErrorCodes.USER_ALREADY_EXISTS]: {
    status: HttpStatus.CONFLICT,
    message: ErrorMessages.USER_ALREADY_EXISTS,
  },

  [ErrorCodes.MOBILE_ALREADY_IN_USE]: {
    status: HttpStatus.CONFLICT,
    message: ErrorMessages.MOBILE_ALREADY_IN_USE,
  },

  [ErrorCodes.OTP_INVALID]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.OTP_INVALID,
  },

  [ErrorCodes.OTP_EXPIRED]: {
    status: HttpStatus.BAD_REQUEST,
    message: ErrorMessages.OTP_EXPIRED,
  },

  [ErrorCodes.EMAIL_SEND_FAILED]: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: ErrorMessages.EMAIL_SEND_FAILED,
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
};
