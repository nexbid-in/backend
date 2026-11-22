import { GetOrdersRequestDTO, OrderResponseDTO } from "../../../dto/trading/OrderDTOs";

export interface IGetOrdersUseCase {
  execute(dto: GetOrdersRequestDTO): Promise<OrderResponseDTO[]>;
}

