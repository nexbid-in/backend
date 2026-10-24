import Razorpay from "razorpay";
import crypto from "crypto";
import {
  IPaymentGatewayService,
  GatewayOrderResult,
} from "../../../application/interface/services/IPaymentGatewayService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class RazorpayService implements IPaymentGatewayService {
  private readonly _razorpay: Razorpay;
  private readonly _keyId: string;
  private readonly _keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this._keyId = keyId;
    this._keySecret = keySecret;
    this._razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  getKeyId(): string {
    return this._keyId;
  }

  async createOrder(amountInPaise: number, receipt: string): Promise<GatewayOrderResult> {
    try {
      const order = await this._razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt,
      });

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch {
      throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this._keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
      const actualBuffer = Buffer.from(signature, "utf-8");

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }
}
