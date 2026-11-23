
export const SuccessMessages = {
  LOGIN_SUCCESS: "Login successfully",
  USER_AUTHENTICATED: "User authenticated",
  LOGOUT_SUCCESS: "Logged out successfully",

  OTP_SENT: "OTP sent successfully",
  OTP_VERIFIED: "OTP verified successfully",
  REGISTRATION_COMPLETED: "User registration completed successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",

  PROFILE_RETRIEVED: "Profile retrieved successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",

  USERS_RETRIEVED: "Users retrieved successfully",
  USER_STATUS_UPDATED: "User status updated successfully",

  WALLET_OVERVIEW_RETRIEVED: "Wallet overview retrieved successfully",
  WALLET_STATEMENT_RETRIEVED: "Wallet statement retrieved successfully",
  ORDER_CREATED: "Payment order created successfully",
  PAYMENT_VERIFIED: "Payment verified and wallet credited successfully",
  PAYMENT_FAILED: "Payment marked as failed successfully",
  TOPUP_HISTORY_RETRIEVED: "Top-up history retrieved successfully",

  STOCKS_RETRIEVED: "Instruments retrieved successfully",
  INSTRUMENTS_RETRIEVED: "Instruments retrieved successfully",
  ADMIN_STOCKS_RETRIEVED: "Instruments retrieved successfully",
  ADMIN_STOCK_CREATED: "Instrument created successfully",
  ADMIN_STOCK_STATUS_UPDATED: "Instrument status updated successfully",
  ADMIN_STOCK_UPDATED: "Instrument updated successfully",
  ADMIN_STOCK_DELETED: "Instrument deleted successfully",
  ADMIN_STOCK_VERIFIED: "Instrument ticker verified successfully",
  WATCHLIST_RETRIEVED: "Watchlist retrieved successfully",
  WATCHLIST_ITEM_ADDED: "Stock added to watchlist successfully",
  WATCHLIST_ITEM_REMOVED: "Stock removed from watchlist successfully",

  ORDER_PLACED: "Order placed successfully",
  AMO_ORDER_PLACED: "After Market Order (AMO) placed successfully. It will be submitted when market opens.",
  ORDERS_RETRIEVED: "Orders retrieved successfully",
  ORDER_CANCELLED: "Order cancelled successfully",
  ORDER_METRICS_RETRIEVED: "Order metrics retrieved successfully",
  ORDER_DETAILS_RETRIEVED: "Order details retrieved successfully",
  POSITIONS_RETRIEVED: "Positions retrieved successfully",
  HOLDINGS_RETRIEVED: "Holdings retrieved successfully",
  PNL_STATEMENT_RETRIEVED: "P&L Statement retrieved successfully",
  POSITION_SQUARED_OFF: "Position squared off successfully",
  MARKET_STATUS_RETRIEVED: "Market status retrieved successfully",
} as const;
