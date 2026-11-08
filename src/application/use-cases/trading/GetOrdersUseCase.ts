import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { GetOrdersRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";

export class GetOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(dto: GetOrdersRequestDTO): Promise<OrderResponseDTO[]> {
    const orders = await this.orderRepo.findByUserId(dto.userId, dto.status);

    return orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      stockId: order.stockId,
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      productType: order.productType,
      status: order.status,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
      price: order.price,
      averagePrice: order.averagePrice,
      triggerPrice: order.triggerPrice,
      rejectionReason: order.rejectionReason,
      blockedMargin: order.blockedMargin,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }
}

