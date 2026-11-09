import { GetPositionsResponseDTO } from "../../../dto/trading/PositionDTOs";

export interface IGetPositionsUseCase {
  execute(userId: string, filter?: "OPEN" | "ALL"): Promise<GetPositionsResponseDTO>;
}

