import { WalletTransactionType } from "../../../domain/entities/WalletTransaction";

export type GetWalletStatementQueryDTO = {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  type?: WalletTransactionType | "ALL";
  startDate?: Date;
  endDate?: Date;
};

export type WalletStatementItemDTO = {
  id: string;
  referenceId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

export type PaginatedWalletStatementResponseDTO = {
  transactions: WalletStatementItemDTO[];
  pagination: {
    page: number;
    limit: number;
    totalTransactions: number;
    totalPages: number;
  };
};
