
export const ErrorMessages = {
  // ==========================================
  // Authentication & Authorization
  // ==========================================
  UNAUTHORIZED: "Please log in to access this resource.",
  FORBIDDEN: "You do not have permission to perform this action.",
  INVALID_AUTH_HEADER: "Invalid authorization header",
  INVALID_CREDENTIALS: "Invalid email or password.",
  LOGIN_RATE_LIMIT_EXCEEDED : "Too many login attempts. Please try again in 5 minutes.",
  ACCOUNT_BLOCKED: "This account has been blocked.",

  // ==========================================
  // Registration & OTP
  // ==========================================
  INVALID_EMAIL: "Invalid email address",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  FAILED_TO_SEND_OTP: "Failed to send verification code.",
  OTP_INVALID: "Invalid verification code.",
  OTP_EXPIRED: "Verification code has expired. Please register again.",
  OTP_TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new verification code.",
  OTP_RATE_LIMIT_EXCEEDED: "Too many requests. Please try again in 15 minutes.",

  // ==========================================
  // Validation
  // ==========================================
  VALIDATION_FAILED: "Validation failed",

  // ==========================================
  // System & Generic
  // ==========================================
  NOT_FOUND: "Resource not found",
  INTERNAL_SERVER_ERROR: "Internal server error",
  USER_ID_GENERATION_FAILED: "Failed to generate a unique user ID. Please try again.",

} as const;
