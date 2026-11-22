export interface MarketStatusInfo {
  isOpen: boolean;
  isMisAllowed: boolean;
  isAmoAllowed: boolean;
  session: "REGULAR" | "PRE_MARKET" | "POST_MARKET" | "CLOSED";
  currentIstTime: string;
  enforceMarketHours: boolean;
}

export class MarketHoursService {
  public static getIstDateComponents(date: Date = new Date()): {
    dayOfWeek: number;
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

  public static isMarketOpen(date: Date = new Date()): boolean {
    const { dayOfWeek, minuteOfDay } = this.getIstDateComponents(date);
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    return minuteOfDay >= 555 && minuteOfDay <= 930;
  }

  public static isMisAllowed(date: Date = new Date()): boolean {
    const { dayOfWeek, minuteOfDay } = this.getIstDateComponents(date);
    if (dayOfWeek < 1 || dayOfWeek > 5) return false;
    return minuteOfDay >= 555 && minuteOfDay <= 920;
  }

  public static isAmoAllowed(date: Date = new Date()): boolean {
    return !this.isMarketOpen(date);
  }

  public static getStartOfTodayIst(): Date {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(Date.now() + istOffsetMs);
    nowIst.setUTCHours(0, 0, 0, 0);
    return new Date(nowIst.getTime() - istOffsetMs);
  }

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
        session = "PRE_MARKET";
      } else if (minuteOfDay >= 555 && minuteOfDay <= 930) {
        session = "REGULAR";
      } else if (minuteOfDay > 930 && minuteOfDay <= 960) {
        session = "POST_MARKET";
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

