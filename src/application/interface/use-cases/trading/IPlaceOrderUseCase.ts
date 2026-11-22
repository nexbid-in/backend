import { PlaceOrderRequestDTO, OrderResponseDTO } from "../../../dto/trading/OrderDTOs";

export interface IPlaceOrderUseCase {
  execute(dto: PlaceOrderRequestDTO): Promise<OrderResponseDTO>;
}

