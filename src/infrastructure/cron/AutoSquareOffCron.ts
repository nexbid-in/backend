import cron from "node-cron";
import { IPositionRepository } from "../../domain/repositories/trading/IPositionRepository";
import { SquareOffPositionUseCase } from "../../application/use-cases/trading/SquareOffPositionUseCase";
import { logger } from "../logging/logger";

export class AutoSquareOffCron {
  private isExecuting = false;

  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly squareOffUseCase: SquareOffPositionUseCase,
    // 03:20 PM IST (Mon-Fri)
    private readonly cronSchedule: string = "20 15 * * 1-5"
  ) {}

  public start(): void {
    logger.info(
      { schedule: this.cronSchedule },
      "Initializing Intraday MIS Auto-Square-Off Cron (03:20 PM IST)"
    );

    cron.schedule(
      this.cronSchedule,
      async () => {
        await this.runJob();
      },
      { timezone: "Asia/Kolkata" }
    );
  }

  public async runJob(): Promise<void> {
    if (this.isExecuting) {
      logger.warn("Auto square-off job is already running; skipping cycle");
      return;
    }

    this.isExecuting = true;
    try {
      logger.info("Executing scheduled intraday MIS auto square-off...");
      const openMisPositions = await this.positionRepo.findAllOpenMisPositions();

      if (openMisPositions.length === 0) {
        logger.info("No open MIS intraday positions to square off");
        return;
      }

      logger.info(
        { count: openMisPositions.length },
        "Squaring off open intraday MIS positions"
      );

      for (const pos of openMisPositions) {
        try {
          await this.squareOffUseCase.execute({
            userId: pos.userId,
            positionId: pos.id,
          });
          logger.info(
            { positionId: pos.id, symbol: pos.symbol, userId: pos.userId },
            "Successfully auto-squared off MIS position"
          );
        } catch (posErr) {
          logger.error(
            { posErr, positionId: pos.id, symbol: pos.symbol },
            "Failed to auto square-off MIS position"
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "Error executing auto square-off job");
    } finally {
      this.isExecuting = false;
    }
  }
}

