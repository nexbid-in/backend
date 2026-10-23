import { DecimalLike } from "./WalletPersistenceDTO";
import { WalletTransactionType } from "../../../domain/entities/WalletTransaction";

export type WalletTransactionPersistenceDTO = {
  id: string;
  walletId: string;
  userId: string;
  referenceId: string;
  type: WalletTransactionType;
  amount: DecimalLike;
  balanceAfter: DecimalLike;
  description: string;
  metadata?: unknown;
  createdAt: Date;
};
