import { DecimalLike } from "./WalletPersistenceDTO";

export type WalletTransactionPersistenceDTO = {
  id: string;
  walletId: string;
  userId: string;
  referenceId: string;
  type: string;
  amount: DecimalLike;
  balanceAfter: DecimalLike;
  description: string;
  metadata?: any;
  createdAt: Date;
};
