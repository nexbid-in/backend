export interface MarketStatusInfo {
  isOpen: boolean;
  isMisAllowed: boolean;
  isAmoAllowed: boolean;
  session: "REGULAR" | "PRE_MARKET" | "POST_MARKET" | "CLOSED";
  currentIstTime: string;
  enforceMarketHours: boolean;
}

export class MarketHoursService {
  /**
   * Converts any Date or timestamp to IST (Asia/Kolkata, UTC+5:30) date components
   */
  public static getIstDateComponents(date: Date = new Date()): {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    hour: number;
    minute: number;
    minuteOfDay: number;
    formattedTime: string;
  } {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffsetMs);

    const dayOfWeek = istDate.getUTCDay();
    const hour = istDate.getUTCHours();
    const minute = istDate.getUTCMinutes();
    const minuteOfDay = hour * 60 + minute;
    const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} IST`;

    return { dayOfWeek, hour, minute, minuteOfDay, formattedTime };
  }

  /**
   * Checks whether regular Indian equity market (NSE/BSE) is open.
   * Regular trading hours: Monday - Friday, 09:15 AM to 03:30 PM IST (555 to 930 mins).
   */
  public static isMarketOpen(date: Date = new Date()): boolean {
    const { dayOfWeek, minuteOfDay } = this.getIstDateComponents(date);
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    return minuteOfDay >= 555 && minuteOfDay <= 930;
  }

  /**
   * Checks whether new Intraday (MIS) orders are permitted.
   * MIS cutoff is 03:20 PM IST (920 mins) before 03:20 PM auto-square-off takes place.
   */
  public static isMisAllowed(date: Date = new Date()): boolean {
    const { dayOfWeek, minuteOfDay } = this.getIstDateComponents(date);
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    return minuteOfDay >= 555 && minuteOfDay <= 920;
  }

  /**
   * Checks whether After Market Orders (AMO) can be placed.
   * AMO is permitted whenever the regular market session is closed.
   */
  public static isAmoAllowed(date: Date = new Date()): boolean {
    return !this.isMarketOpen(date);
  }

  /**
   * Returns a comprehensive status of current market trading sessions
   */
  public static getMarketStatus(
    enforceMarketHours: boolean,
    date: Date = new Date()
  ): MarketStatusInfo {
    const { dayOfWeek, minuteOfDay, formattedTime } = this.getIstDateComponents(date);
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isOpen = isWeekday && minuteOfDay >= 555 && minuteOfDay <= 930;
    const isMisAllowed = isWeekday && minuteOfDay >= 555 && minuteOfDay <= 920;

    let session: "REGULAR" | "PRE_MARKET" | "POST_MARKET" | "CLOSED" = "CLOSED";
    if (isWeekday) {
      if (minuteOfDay >= 540 && minuteOfDay < 555) {
        session = "PRE_MARKET"; // 09:00 - 09:15 AM IST
      } else if (minuteOfDay >= 555 && minuteOfDay <= 930) {
        session = "REGULAR"; // 09:15 AM - 03:30 PM IST
      } else if (minuteOfDay > 930 && minuteOfDay <= 960) {
        session = "POST_MARKET"; // 03:30 PM - 04:00 PM IST
      }
    }

    return {
      isOpen,
      isMisAllowed,
      isAmoAllowed: !isOpen,
      session,
      currentIstTime: formattedTime,
      enforceMarketHours,
    };
  }
}

