import cron from "node-cron";
import { IOrderMatchingEngine } from "../../application/interface/services/IOrderMatchingEngine";
import { OrderPricingService } from "../../application/services/trading/OrderPricingService";
import { OrderType } from "../../domain/entities/trading/Order";
import { IOrderRepository } from "../../domain/repositories/trading/IOrderRepository";
import { logger } from "../logging/logger";

export class AmoDispatchCron {
  private isExecuting = false;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly pricingService: OrderPricingService,
    private readonly matchingEngine: IOrderMatchingEngine,
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
            const fillPrice = await this.pricingService.resolveMarketPrice(
              order.symbol,
              order.side,
              100
            );

            await this.matchingEngine.executeOrder(order, fillPrice);
            logger.info(
              { orderId: order.id, symbol: order.symbol, fillPrice },
              "Successfully executed pending Market AMO at market open"
            );
          } else {
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
