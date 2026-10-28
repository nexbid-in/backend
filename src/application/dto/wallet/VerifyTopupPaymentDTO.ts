export type VerifyTopupPaymentRequestDTO = {
  userId: string;
  orderId: string;
  paymentId: string;
  signature: string;
};

export type VerifyTopupPaymentResponseDTO = {
  success: boolean;
  balance: number;
  virtualAmountAdded: number;
};
