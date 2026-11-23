import {
  PnlStatementQueryDTO,
  GetPnlStatementResponseDTO,
} from "../../../dto/trading/PnlDTOs";

export interface IGetPnlStatementUseCase {
  execute(userId: string, query: PnlStatementQueryDTO): Promise<GetPnlStatementResponseDTO>;
}
