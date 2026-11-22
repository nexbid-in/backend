import { GetHoldingsResponseDTO } from "../../../dto/trading/HoldingDTOs";

export interface IGetHoldingsUseCase {
  execute(userId: string): Promise<GetHoldingsResponseDTO>;
}
