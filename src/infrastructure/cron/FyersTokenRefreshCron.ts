import cron from "node-cron";
import { FyersAuthService } from "../external/market/FyersAuthService";
import { IBrokerAuthService } from "../../application/interface/services/IBrokerAuthService";
import { logger } from "../logging/logger";
import { env } from "../config/env";
import redis from "../config/redis";

export class FyersTokenRefreshCron {
  private _isExecuting = false;

  constructor(
    private readonly _brokerAuthService: IBrokerAuthService,
    // 06:15 AM IST, runs Monday through Friday
    private readonly _cronSchedule: string = "15 6 * * 1-5"
  ) {}

  public start(): void {
    if (env.MARKET_DATA_PROVIDER !== "fyers") {
      logger.info("FyersTokenRefreshCron skipped: MARKET_DATA_PROVIDER is not 'fyers'");
      return;
    }

    logger.info({ schedule: this._cronSchedule, timezone: "Asia/Kolkata" }, "Initializing Fyers Token Refresh Cron");

    // Startup check: Ensure a valid token exists in Redis upon server boot
    setTimeout(() => {
      void this.checkInitialToken();
    }, 3000);

    // Schedule daily pre-market execution in IST
    cron.schedule(
      this._cronSchedule,
      () => {
        void this.runJob();
      },
      {
        timezone: "Asia/Kolkata"
      }
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8")) as { exp?: number };
      if (typeof payload.exp !== "number") return true;
      return payload.exp * 1000 <= Date.now() + 60000;
    } catch {
      return true;
    }
  }

  private async checkInitialToken(): Promise<void> {
    try {
      const token = await redis.get(FyersAuthService.REDIS_TOKEN_KEY);
      if (!token || this.isTokenExpired(token)) {
        logger.info("No valid active Fyers access token found in Redis on startup. Generating new token...");
        await this._brokerAuthService.generateAndStoreAccessToken();
      } else {
        logger.info("Active Fyers access token is already present and valid in Redis");
      }
    } catch (err) {
      logger.error({ error: err }, "Error checking/generating initial Fyers token on startup");
    }
  }

  public async runJob(): Promise<void> {
    if (this._isExecuting) {
      logger.warn("Fyers token refresh job is already in progress. Skipping cycle.");
      return;
    }

    this._isExecuting = true;
    try {
      logger.info("Starting scheduled Fyers token refresh job...");
      await this._brokerAuthService.generateAndStoreAccessToken();
      logger.info("Scheduled Fyers token refresh completed successfully");
    } catch (error) {
      logger.error({ error }, "Error during scheduled Fyers token refresh execution");
    } finally {
      this._isExecuting = false;
    }
  }
}
