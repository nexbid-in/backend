export interface GatewayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
}

export interface GatewayPaymentItem {
  id: string;
  status: string; // 'captured' | 'failed' | 'authorized' | 'created'
  amount: number;
}

export interface IPaymentGatewayService {
  createOrder(amountInPaise: number, receipt: string): Promise<GatewayOrderResult>;
  verifySignature(orderId: string, paymentId: string, signature: string): boolean;
  getKeyId(): string;
  getOrderPayments(orderId: string): Promise<GatewayPaymentItem[]>;
}

