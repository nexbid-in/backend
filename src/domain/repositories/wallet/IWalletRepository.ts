import { Wallet } from "../../entities/Wallet";
import { WalletTransaction } from "../../entities/WalletTransaction";

export interface IWalletRepository {
  findById(id: string): Promise<Wallet | null>;
  findByUserId(userId: string): Promise<Wallet | null>;
  findOrCreateByUserId(userId: string): Promise<Wallet>;
  saveWithTransaction(
    wallet: Wallet,
    transaction: WalletTransaction
  ): Promise<void>;
}
