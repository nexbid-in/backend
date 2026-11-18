import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import { MarketHoursService } from "../../services/trading/MarketHoursService";
import { OrderResponseMapper } from "../../mapper/trading/OrderResponseMapper";
import { GetOrdersRequestDTO, OrderResponseDTO } from "../../dto/trading/OrderDTOs";
import { IGetOrdersUseCase } from "../../interface/use-cases/trading/IGetOrdersUseCase";

export class GetOrdersUseCase implements IGetOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(dto: GetOrdersRequestDTO): Promise<OrderResponseDTO[]> {
    const sessionStart =
      dto.scope === "ALL" ? undefined : MarketHoursService.getStartOfTodayIst();

    const orders = await this.orderRepo.findByUserId(
      dto.userId,
      dto.status,
      sessionStart
    );

    return orders.map((order) => OrderResponseMapper.toDTO(order));
  }
}

