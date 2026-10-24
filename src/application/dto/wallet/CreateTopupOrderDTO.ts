export type CreateTopupOrderRequestDTO = {
  userId: string;
  realAmount: number;
};

export type CreateTopupOrderResponseDTO = {
  orderId: string;
  paymentOrderId: string;
  amount: number;
  currency: string;
  virtualAmount: number;
  keyId: string;
};
