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

  ADMIN: {
    BASE: "/admin",
    USERS: "/users",
    UPDATE_USER_STATUS: "/users/:userId/status",
  },
} as const;
