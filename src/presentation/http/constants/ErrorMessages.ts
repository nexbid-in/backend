

export const ErrorMessages = {
  // Auth
  INVALID_AUTH_HEADER: "Invalid authorization header",
  INVALID_EMAIL: "Invalid email address",
  LOGIN_RATE_LIMIT_EXCEEDED : "Too many login attempts. Please try again in 5 minutes.",

  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",

  FAILED_TO_SEND_OTP: "Failed to send verification code.",
  OTP_INVALID: "Invalid verification code.",
  OTP_EXPIRED: "Verification code has expired. Please register again.",
  OTP_TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new verification code.",
  OTP_RATE_LIMIT_EXCEEDED: "Too many requests. Please try again in 15 minutes.",

  USER_ID_GENERATION_FAILED: "Failed to generate a unique user ID. Please try again.",


  // Validation
  VALIDATION_FAILED: "Validation failed",

  // Generic
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",

  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;
