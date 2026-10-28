import { WalletTransaction, WalletTransactionType } from "../../entities/WalletTransaction";
import { PaginatedResult } from "../user/IUserRepository";

export interface WalletStatementQueryOptions {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  type?: WalletTransactionType | "ALL";
  startDate?: Date;
  endDate?: Date;
}

export interface IWalletTransactionRepository {
  findById(id: string): Promise<WalletTransaction | null>;
  findByReferenceId(referenceId: string): Promise<WalletTransaction | null>;
  findStatement(options: WalletStatementQueryOptions): Promise<PaginatedResult<WalletTransaction>>;
}
