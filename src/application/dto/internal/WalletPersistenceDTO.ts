import { WalletStatus } from "../../../domain/entities/Wallet";

export type DecimalLike = number | string | { toNumber(): number };

export type WalletPersistenceDTO = {
  id: string;
  userId: string;
  balance: DecimalLike;
  usedMargin: DecimalLike;
  totalVirtualBought: DecimalLike;
  totalRealSpent: DecimalLike;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
};
