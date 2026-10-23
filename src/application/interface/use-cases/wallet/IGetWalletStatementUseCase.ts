import {
  GetWalletStatementQueryDTO,
  PaginatedWalletStatementResponseDTO,
} from "../../../dto/wallet/GetWalletStatementDTO";

export interface IGetWalletStatementUseCase {
  execute(query: GetWalletStatementQueryDTO): Promise<PaginatedWalletStatementResponseDTO>;
}
