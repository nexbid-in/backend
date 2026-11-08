import cron from "node-cron";
import { IOrderRepository } from "../../domain/repositories/trading/IOrderRepository";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { OrderMatchingEngine } from "../external/trading/OrderMatchingEngine";
import { OrderType } from "../../domain/entities/trading/Order";
import { logger } from "../logging/logger";

export class AmoDispatchCron {
  private isExecuting = false;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly marketDataService: IMarketDataService,
    private readonly matchingEngine: OrderMatchingEngine,
    // 09:15 AM IST (Monday to Friday)
    private readonly cronSchedule: string = "15 9 * * 1-5"
  ) {}

  public start(): void {
    logger.info(
      { schedule: this.cronSchedule },
      "Initializing After-Market Orders (AMO) Dispatch Cron (09:15 AM IST)"
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
      logger.warn("AMO dispatch job is already running; skipping duplicate cycle");
      return;
    }

    this.isExecuting = true;
    try {
      logger.info("Executing scheduled After-Market Orders (AMO) dispatch job...");
      const pendingAmos = await this.orderRepo.findPendingAmoOrders();

      if (pendingAmos.length === 0) {
        logger.info("No pending AMOs found to dispatch");
        return;
      }

      logger.info(
        { count: pendingAmos.length },
        "Processing pending AMOs upon market open"
      );

      for (const order of pendingAmos) {
        try {
          if (order.orderType === OrderType.MARKET) {
            const quote = await this.marketDataService.getQuote(order.symbol);
            const fillPrice = quote?.ltp && quote.ltp > 0 ? quote.ltp : 100;

            await this.matchingEngine.executeOrder(order, fillPrice);
            logger.info(
              { orderId: order.id, symbol: order.symbol, fillPrice },
              "Successfully executed pending Market AMO at market open"
            );
          } else {
            // Limit AMOs will match against live incoming ticks in OrderMatchingEngine.processTick
            logger.info(
              { orderId: order.id, symbol: order.symbol, limitPrice: order.price },
              "Limit AMO is active and awaiting tick match in order book"
            );
          }
        } catch (orderErr) {
          logger.error(
            { orderErr, orderId: order.id, symbol: order.symbol },
            "Failed to dispatch pending AMO"
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "Error executing AMO dispatch job");
    } finally {
      this.isExecuting = false;
    }
  }
}

