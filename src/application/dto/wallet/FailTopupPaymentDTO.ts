export type FailTopupPaymentRequestDTO = {
  userId: string;
  orderId: string;
  paymentId?: string | null;
  reason?: string | null;
};

export type FailTopupPaymentResponseDTO = {
  success: boolean;
  orderId: string;
  status: "FAILED";
};
