import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  GetWalletOverviewRequestDTO,
  GetWalletOverviewResponseDTO,
} from "../../dto/wallet/GetWalletOverviewDTO";
import { IGetWalletOverviewUseCase } from "../../interface/use-cases/wallet/IGetWalletOverviewUseCase";

export class GetWalletOverviewUseCase implements IGetWalletOverviewUseCase {
  constructor(
    private readonly _walletRepo: IWalletRepository,
    private readonly _userRepo: IUserRepository,
    private readonly _virtualCurrencyRate: number = 10
  ) {}

  async execute(data: GetWalletOverviewRequestDTO): Promise<GetWalletOverviewResponseDTO> {
    const user = await this._userRepo.findById(data.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    const wallet = await this._walletRepo.findOrCreateByUserId(data.userId);

    return {
      balance: wallet.balance,
      usedMargin: wallet.usedMargin,
      totalVirtualMoneyBought: wallet.totalVirtualBought,
      totalRealMoneyUsed: wallet.totalRealSpent,
      tradingStatus: wallet.status,
      exchangeRate: {
        real: 1,
        virtual: this._virtualCurrencyRate,
        ratio: this._virtualCurrencyRate,
      },
    };
  }
}
