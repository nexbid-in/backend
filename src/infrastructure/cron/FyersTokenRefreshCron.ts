import cron from "node-cron";
import { IBrokerAuthService } from "../../application/interface/services/IBrokerAuthService";
import { logger } from "../logging/logger";

export class FyersTokenRefreshCron {
  private _isExecuting = false;

  constructor(
    private readonly _brokerAuthService: IBrokerAuthService,
    private readonly _isEnabled: boolean,
    private readonly _cronSchedule: string = "15 6 * * 1-5"
  ) {}

  public start(): void {
    if (!this._isEnabled) {
      logger.info("FyersTokenRefreshCron skipped: MARKET_DATA_PROVIDER is not 'fyers'");
      return;
    }

    logger.info(
      { schedule: this._cronSchedule, timezone: "Asia/Kolkata" },
      "Initializing Fyers Token Refresh Cron"
    );

    setTimeout(() => {
      void this.checkInitialToken();
    }, 3000);

    cron.schedule(
      this._cronSchedule,
      () => {
        void this.runJob();
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
  }

  private async checkInitialToken(): Promise<void> {
    try {
      await this._brokerAuthService.getOrRefreshToken();
      logger.info("Verified active Fyers access token for startup");
    } catch (err) {
      logger.error(
        { error: err },
        "Error checking/generating initial Fyers token on startup"
      );
    }
  }

  public async runJob(): Promise<void> {
    if (this._isExecuting) {
      logger.warn("Fyers token refresh job is already running. Skipping cycle.");
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
