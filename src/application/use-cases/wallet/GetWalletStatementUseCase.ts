import { IWalletTransactionRepository } from "../../../domain/repositories/wallet/IWalletTransactionRepository";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  GetWalletStatementQueryDTO,
  PaginatedWalletStatementResponseDTO,
} from "../../dto/wallet/GetWalletStatementDTO";
import { IGetWalletStatementUseCase } from "../../interface/use-cases/wallet/IGetWalletStatementUseCase";

export class GetWalletStatementUseCase implements IGetWalletStatementUseCase {
  constructor(
    private readonly _walletTransactionRepo: IWalletTransactionRepository,
    private readonly _userRepo: IUserRepository
  ) {}

  async execute(query: GetWalletStatementQueryDTO): Promise<PaginatedWalletStatementResponseDTO> {
    const user = await this._userRepo.findById(query.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    const { data: records, total } = await this._walletTransactionRepo.findStatement({
      userId: query.userId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      type: query.type,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const transactions = records.map((tx) => ({
      id: tx.id,
      referenceId: tx.referenceId,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      description: tx.description,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
    }));

    return {
      transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalTransactions: total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}
