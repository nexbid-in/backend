import {
  GetWalletOverviewRequestDTO,
  GetWalletOverviewResponseDTO,
} from "../../../dto/wallet/GetWalletOverviewDTO";

export interface IGetWalletOverviewUseCase {
  execute(data: GetWalletOverviewRequestDTO): Promise<GetWalletOverviewResponseDTO>;
}
