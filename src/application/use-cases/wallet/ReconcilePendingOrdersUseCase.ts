import {
  IReconcilePendingOrdersUseCase,
  ReconcilePendingOrdersResult,
} from "../../interface/use-cases/wallet/IReconcilePendingOrdersUseCase";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IPaymentGatewayService } from "../../interface/services/IPaymentGatewayService";
import { WalletTopupSettlementService } from "../../services/wallet/WalletTopupSettlementService";
import { logger } from "../../../infrastructure/logging/logger";

export class ReconcilePendingOrdersUseCase implements IReconcilePendingOrdersUseCase {
  constructor(
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _walletRepo: IWalletRepository,
    private readonly _paymentGateway: IPaymentGatewayService,
    private readonly _settlementService: WalletTopupSettlementService
  ) {}

  async execute(olderThanMinutes = 15): Promise<ReconcilePendingOrdersResult> {
    const cutoffDate = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const staleOrders = await this._paymentOrderRepo.findStalePendingOrders(cutoffDate);

    let markedSuccess = 0;
    let markedFailed = 0;

    for (const order of staleOrders) {
      try {
        const payments = await this._paymentGateway.getOrderPayments(order.orderId);
        const capturedPayment = payments.find((p) => p.status === "captured");

        if (capturedPayment) {
          const wallet = await this._walletRepo.findByUserId(order.userId);
          if (wallet) {
            await this._settlementService.settleTopupSuccess({
              wallet,
              paymentOrder: order,
              paymentId: capturedPayment.id,
              description: `Virtual money top-up (₹${order.realAmount}) [Auto-Reconciled]`,
              metadata: {
                orderId: order.orderId,
                paymentId: capturedPayment.id,
                reconciledBy: "BACKGROUND_RECONCILIATION_CRON",
              },
            });

            markedSuccess++;
            logger.info(
              { orderId: order.orderId, paymentId: capturedPayment.id },
              "Reconciled pending order to SUCCESS"
            );
            continue;
          }
        }

        const lastFailedPayment = payments.find((p) => p.status === "failed");
        order.markAsFailed(lastFailedPayment?.id);
        await this._paymentOrderRepo.save(order);
        markedFailed++;
        logger.info(
          { orderId: order.orderId, paymentId: lastFailedPayment?.id },
          "Reconciled abandoned pending order to FAILED"
        );
      } catch (err) {
        logger.error(
          { orderId: order.orderId, error: err },
          "Failed to reconcile order"
        );
      }
    }

    return {
      totalProcessed: staleOrders.length,
      markedSuccess,
      markedFailed,
    };
  }
}
