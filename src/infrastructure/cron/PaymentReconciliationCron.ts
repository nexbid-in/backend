import cron from "node-cron";
import { IReconcilePendingOrdersUseCase } from "../../application/interface/use-cases/wallet/IReconcilePendingOrdersUseCase";
import { logger } from "../logging/logger";

export class PaymentReconciliationCron {
  private _isExecuting = false;

  constructor(
    private readonly _reconcilePendingOrders: IReconcilePendingOrdersUseCase,
    private readonly _cronSchedule: string = "*/15 * * * *",
    private readonly _olderThanMinutes: number = 15
  ) {}

  public start(): void {
    logger.info(
      { schedule: this._cronSchedule, olderThanMinutes: this._olderThanMinutes },
      "Initializing Payment Reconciliation Cron"
    );

    // Run once shortly after server startup to resolve any past abandoned orders
    setTimeout(() => {
      this.runJob().catch((err) => {
        logger.error({ error: err }, "Error running initial payment reconciliation job");
      });
    }, 5000);

    // Schedule periodic execution
    cron.schedule(this._cronSchedule, async () => {
      await this.runJob();
    });
  }

  public async runJob(): Promise<void> {
    if (this._isExecuting) {
      logger.warn("Payment reconciliation job is already running. Skipping cycle.");
      return;
    }

    this._isExecuting = true;
    try {
      logger.info("Starting background payment reconciliation job...");
      const result = await this._reconcilePendingOrders.execute(this._olderThanMinutes);
      logger.info(
        result,
        "Completed background payment reconciliation job"
      );
    } catch (error) {
      logger.error({ error }, "Error during payment reconciliation job execution");
    } finally {
      this._isExecuting = false;
    }
  }
}
