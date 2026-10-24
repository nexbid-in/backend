import { DecimalLike } from "./WalletPersistenceDTO";
import { PaymentStatus } from "../../../domain/entities/PaymentOrder";

export type PaymentOrderPersistenceDTO = {
  id: string;
  userId: string;
  orderId: string;
  paymentId: string | null;
  realAmount: DecimalLike;
  virtualAmount: DecimalLike;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};
