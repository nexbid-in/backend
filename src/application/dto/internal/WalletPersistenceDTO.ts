export type DecimalLike = number | string | { toNumber(): number };

export type WalletPersistenceDTO = {
  id: string;
  userId: string;
  balance: DecimalLike;
  usedMargin: DecimalLike;
  totalVirtualBought: DecimalLike;
  totalRealSpent: DecimalLike;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
