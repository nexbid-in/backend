export type GetWalletOverviewRequestDTO = {
  userId: string;
};

export type GetWalletOverviewResponseDTO = {
  balance: number;
  usedMargin: number;
  totalVirtualMoneyBought: number;
  totalRealMoneyUsed: number;
  tradingStatus: string;
  exchangeRate: {
    real: number;
    virtual: number;
    ratio: number;
  };
};
