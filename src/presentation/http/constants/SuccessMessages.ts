
export const SuccessMessages = {
  // ==========================================
  // Authentication & Authorization
  // ==========================================
  LOGIN_SUCCESS: "Login successfully",
  USER_AUTHENTICATED: "User authenticated",
  LOGOUT_SUCCESS: "Logged out successfully",

  // ==========================================
  // Registration & OTP
  // ==========================================
  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified successfully",
  REGISTRATION_COMPLETED: "User registration completed successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",

  // ==========================================
  // User & Profile
  // ==========================================
  PROFILE_RETRIEVED: "Profile retrieved successfully",
  PROFILE_UPDATED: "Profile updated successfully",

  // ==========================================
  // Admin & Management
  // ==========================================
  USERS_RETRIEVED: "Users retrieved successfully",
  USER_STATUS_UPDATED: "User status updated successfully",

  // ==========================================
  // Wallet & Payment
  // ==========================================
  WALLET_OVERVIEW_RETRIEVED: "Wallet overview retrieved successfully",
  WALLET_STATEMENT_RETRIEVED: "Wallet statement retrieved successfully",
  ORDER_CREATED: "Payment order created successfully",
  PAYMENT_VERIFIED: "Payment verified and wallet credited successfully",
  PAYMENT_FAILED: "Payment marked as failed successfully",
  TOPUP_HISTORY_RETRIEVED: "Top-up history retrieved successfully",
} as const;
