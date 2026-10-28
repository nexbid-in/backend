import {
  GetTopupHistoryQueryDTO,
  PaginatedTopupHistoryResponseDTO,
} from "../../../dto/wallet/GetTopupHistoryDTO";

export interface IGetTopupHistoryUseCase {
  execute(query: GetTopupHistoryQueryDTO): Promise<PaginatedTopupHistoryResponseDTO>;
}
