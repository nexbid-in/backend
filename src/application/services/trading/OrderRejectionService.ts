import { Order, OrderStatus, OrderType } from "../../../domain/entities/trading/Order";
import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { AppError } from "../../../shared/errors/AppError";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { IErrorMessageResolver } from "../../interface/services/IErrorMessageResolver";
import { IIdGenerator } from "../../interface/services/IIdGenerator";
import { OrderMarginService } from "./OrderMarginService";

/**
 * Handles failed order placement compensation: releasing any blocked margin,
 * resolving the rejection reason, and persisting the REJECTED order record.
 */
export class OrderRejectionService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly marginService: OrderMarginService,
    private readonly idGenerator: IIdGenerator,
    private readonly errorMessageResolver: IErrorMessageResolver
  ) {}

  async handlePlacementFailure(params: {
    dto: PlaceOrderRequestDTO;
    stockId: string;
    cleanSymbol: string;
    existingOrder: Order | null;
    blockedMargin: number;
    error: unknown;
  }): Promise<void> {
    const {
      dto,
      stockId,
      cleanSymbol,
      existingOrder,
      blockedMargin,
      error,
    } = params;

    if (blockedMargin > 0) {
      await this.marginService.releaseMargin(dto.userId, blockedMargin);
    }

    const rejectionReason = this.extractRejectionReason(error);

    if (existingOrder) {
      existingOrder.markRejected(rejectionReason);
      await this.orderRepo.update(existingOrder);
      return;
    }

    const rejectedOrder = Order.create({
      id: this.idGenerator.generate("ORD"),
      userId: dto.userId,
      stockId,
      symbol: cleanSymbol,
      side: dto.side,
      orderType: dto.orderType,
      productType: dto.productType,
      status: OrderStatus.REJECTED,
      quantity: dto.quantity,
      price: dto.orderType === OrderType.LIMIT ? dto.price : null,
      triggerPrice: dto.triggerPrice ?? null,
      blockedMargin: 0,
      rejectionReason,
      isAmo: dto.isAmo ?? false,
    });

    await this.orderRepo.save(rejectedOrder);
  }

  private extractRejectionReason(err: unknown): string {
    if (err instanceof AppError) {
      if (err.message && err.message.trim() !== "") {
        return err.message;
      }
      const mappedMessage = this.errorMessageResolver.resolve(err.code);
      if (mappedMessage) {
        return mappedMessage;
      }
    }

    if (err instanceof Error && err.message && err.message.trim() !== "") {
      return err.message;
    }

    return "Order rejected by risk management system";
  }
}
