import cron from "node-cron";
import { IOrderRepository } from "../../domain/repositories/trading/IOrderRepository";
import { IWalletRepository } from "../../domain/repositories/wallet/IWalletRepository";
import { OrderMatchingEngine } from "../external/trading/OrderMatchingEngine";
import { OrderType, ProductType } from "../../domain/entities/trading/Order";
import { MarketHoursService } from "../../application/services/trading/MarketHoursService";
import { env } from "../config/env";
import { logger } from "../logging/logger";

export class EodOrderExpiryCron {
  private isExecuting = false;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly matchingEngine: OrderMatchingEngine,
    private readonly eodSchedule: string = "31 15 * * 1-5",
    private readonly rolloverSchedule: string = "0 0 * * *"
  ) {}

  public start(): void {
    logger.info(
      { eodSchedule: this.eodSchedule, rolloverSchedule: this.rolloverSchedule },
      "Initializing EOD Day-Order Expiry & Midnight Rollover Crons"
    );

    cron.schedule(
      this.eodSchedule,
      async () => {
        if (env.ENFORCE_MARKET_HOURS) {
          await this.expirePendingDayOrders();
        }
      },
      { timezone: "Asia/Kolkata" }
    );

    cron.schedule(
      this.rolloverSchedule,
      async () => {
        await this.expireStaleDayOrders();
      },
      { timezone: "Asia/Kolkata" }
    );
  }

  public async expireStaleDayOrders(): Promise<void> {
    const startOfTodayIst = MarketHoursService.getStartOfTodayIst();
    await this.expirePendingDayOrders(startOfTodayIst);
  }

  public async expirePendingDayOrders(beforeDate?: Date): Promise<void> {
    if (this.isExecuting) {
      logger.warn("EOD order expiry job is already running; skipping duplicate cycle");
      return;
    }

    this.isExecuting = true;
    try {
      const pendingDayOrders = await this.orderRepo.findPendingDayOrders(beforeDate);
      if (pendingDayOrders.length === 0) {
        return;
      }

      logger.info(
        { count: pendingDayOrders.length, beforeDate: beforeDate?.toISOString() },
        "Expiring pending day orders and releasing blocked margin"
      );

      for (const order of pendingDayOrders) {
        try {
          this.matchingEngine.removeOrderFromBook(order.id, order.symbol);

          const current = await this.orderRepo.findById(order.id);
          if (!current || !current.isPending()) {
            continue;
          }

          current.markCancelled("Day order expired at market close");
          await this.orderRepo.update(current);

          if (
            current.blockedMargin > 0 &&
            (current.productType === ProductType.MIS || current.orderType === OrderType.LIMIT)
          ) {
            const wallet = await this.walletRepo.findOrCreateByUserId(current.userId);
            if (wallet.usedMargin.isGreaterThanOrEqual(current.blockedMargin)) {
              wallet.releaseMargin(current.blockedMargin);
              await this.walletRepo.update(wallet);
            }
          }

          logger.info(
            { orderId: current.id, symbol: current.symbol, userId: current.userId },
            "Expired pending day order"
          );
        } catch (orderErr) {
          logger.error(
            { orderErr, orderId: order.id, symbol: order.symbol },
            "Failed to expire pending day order"
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "Error executing EOD order expiry job");
    } finally {
      this.isExecuting = false;
    }
  }
}

