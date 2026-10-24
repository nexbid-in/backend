import {
  CreateTopupOrderRequestDTO,
  CreateTopupOrderResponseDTO,
} from "../../../dto/wallet/CreateTopupOrderDTO";

export interface ICreateTopupOrderUseCase {
  execute(data: CreateTopupOrderRequestDTO): Promise<CreateTopupOrderResponseDTO>;
}
