export const ApiRoutes = {
  BASE: "/api",

  AUTH: {
    BASE: "/auth",
    REGISTER: "/register",
    VERIFY_EMAIL: "/verify-email",
    RESEND_OTP: "/resend-otp",
    LOGIN: "/login",
    LOGOUT: "/logout",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    REFRESH: "/refresh",
    ME: "/me",
    GOOGLE: "/google",
  },

  USER: {
    BASE: "/users",
    PROFILE: "/profile",
    UPLOAD_SIGNATURE: "/profile/upload-signature",
    CHANGE_PASSWORD: "/profile/change-password",
  },

  ADMIN: {
    BASE: "/admin",
    USERS: "/users",
    UPDATE_USER_STATUS: "/users/:userId/status",
  },

  WALLET: {
    BASE: "/wallet",
    OVERVIEW: "/overview",
    STATEMENT: "/statement",
    CREATE_ORDER: "/create-order",
    VERIFY_PAYMENT: "/verify-payment",
    FAIL_PAYMENT: "/fail-payment",
    TOPUP_HISTORY: "/topup-history",
  },
} as const;
