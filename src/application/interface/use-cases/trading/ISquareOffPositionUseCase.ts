import { SquareOffPositionRequestDTO, PositionResponseDTO } from "../../../dto/trading/PositionDTOs";

export interface ISquareOffPositionUseCase {
  execute(dto: SquareOffPositionRequestDTO): Promise<PositionResponseDTO>;
}

