

export const ErrorMessages = {
  // Auth / Registration
  REGISTRATION_TOKEN_MISSING: "Registration token missing",
  INVALID_AUTH_HEADER: "Invalid authorization header",
  INVALID_REGISTRATION_TOKEN: "Invalid or expired registration token",
  INVALID_EMAIL: "Invalid email address",

  USER_ALREADY_EXISTS: "User already exists",
  MOBILE_ALREADY_IN_USE: "Mobile number already in use",

  OTP_INVALID: "Invalid OTP",
  OTP_EXPIRED: "OTP has expired",
  OTP_TOO_MANY_ATTEMPTS: "Too many invalid OTP attempts. Please request a new OTP.",

  USER_ID_GENERATION_FAILED: "Failed to generate a unique user ID. Please try again.",


  // Validation
  VALIDATION_FAILED: "Validation failed",

  // Email
  EMAIL_SEND_FAILED: "Failed to send OTP email",

  // Generic
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",

  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;
