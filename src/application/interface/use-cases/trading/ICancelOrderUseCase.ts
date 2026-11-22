import { CancelOrderRequestDTO, OrderResponseDTO } from "../../../dto/trading/OrderDTOs";

export interface ICancelOrderUseCase {
  execute(dto: CancelOrderRequestDTO): Promise<OrderResponseDTO>;
}

