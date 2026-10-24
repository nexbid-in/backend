import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { WalletTransactionRepository } from "../../infrastructure/repositories/wallet/WalletTransactionRepository";
import { PaymentOrderRepository } from "../../infrastructure/repositories/payment/PaymentOrderRepository";
import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { RazorpayService } from "../../infrastructure/services/payment/RazorpayService";
import { env } from "../../infrastructure/config/env";

import { GetWalletOverviewUseCase } from "../../application/use-cases/wallet/GetWalletOverviewUseCase";
import { GetWalletStatementUseCase } from "../../application/use-cases/wallet/GetWalletStatementUseCase";
import { CreateTopupOrderUseCase } from "../../application/use-cases/wallet/CreateTopupOrderUseCase";
import { VerifyTopupPaymentUseCase } from "../../application/use-cases/wallet/VerifyTopupPaymentUseCase";
import { WalletController } from "../../presentation/http/controllers/wallet/WalletController";

// Repositories & Services
const walletRepository = new WalletRepository();
const walletTransactionRepository = new WalletTransactionRepository();
const paymentOrderRepository = new PaymentOrderRepository();
const userRepository = new UserRepository();
const paymentGatewayService = new RazorpayService(
  env.RAZORPAY_KEY_ID,
  env.RAZORPAY_KEY_SECRET
);

// Use Cases
const getWalletOverviewUseCase = new GetWalletOverviewUseCase(
  walletRepository,
  userRepository,
  env.VIRTUAL_CURRENCY_RATE
);

const getWalletStatementUseCase = new GetWalletStatementUseCase(
  walletTransactionRepository,
  userRepository
);

const createTopupOrderUseCase = new CreateTopupOrderUseCase(
  userRepository,
  walletRepository,
  paymentOrderRepository,
  paymentGatewayService,
  env.VIRTUAL_CURRENCY_RATE
);

const verifyTopupPaymentUseCase = new VerifyTopupPaymentUseCase(
  walletRepository,
  paymentOrderRepository,
  paymentGatewayService
);

export const walletController = new WalletController(
  getWalletOverviewUseCase,
  getWalletStatementUseCase,
  createTopupOrderUseCase,
  verifyTopupPaymentUseCase
);
