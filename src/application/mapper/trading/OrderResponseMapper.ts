import { Order } from "../../../domain/entities/trading/Order";
import { OrderResponseDTO } from "../../dto/trading/OrderDTOs";

export class OrderResponseMapper {
  static toDTO(order: Order): OrderResponseDTO {
    return {
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
      isAmo: order.isAmo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
