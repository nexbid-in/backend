import { WalletRepository } from "../../infrastructure/repositories/wallet/WalletRepository";
import { WalletTransactionRepository } from "../../infrastructure/repositories/wallet/WalletTransactionRepository";
import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetWalletOverviewUseCase } from "../../application/use-cases/wallet/GetWalletOverviewUseCase";
import { GetWalletStatementUseCase } from "../../application/use-cases/wallet/GetWalletStatementUseCase";
import { WalletController } from "../../presentation/http/controllers/wallet/WalletController";
import { env } from "../../infrastructure/config/env";

const walletRepository = new WalletRepository();
const walletTransactionRepository = new WalletTransactionRepository();
const userRepository = new UserRepository();

const getWalletOverviewUseCase = new GetWalletOverviewUseCase(
  walletRepository,
  userRepository,
  env.VIRTUAL_CURRENCY_RATE
);

const getWalletStatementUseCase = new GetWalletStatementUseCase(
  walletTransactionRepository,
  userRepository
);

export const walletController = new WalletController(
  getWalletOverviewUseCase,
  getWalletStatementUseCase
);
