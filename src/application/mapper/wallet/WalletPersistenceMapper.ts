import { Wallet } from "../../../domain/entities/Wallet";
import { WalletPersistenceDTO } from "../../dto/internal/WalletPersistenceDTO";

export class WalletPersistenceMapper {
  static toPrisma(wallet: Wallet): WalletPersistenceDTO {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance.toString(),
      usedMargin: wallet.usedMargin.toString(),
      totalVirtualBought: wallet.totalVirtualBought.toString(),
      totalRealSpent: wallet.totalRealSpent.toString(),
      status: wallet.status,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  static toDomain(raw: WalletPersistenceDTO): Wallet {
    return Wallet.create({
      id: raw.id,
      userId: raw.userId,
      balance: raw.balance.toString(),
      usedMargin: raw.usedMargin.toString(),
      totalVirtualBought: raw.totalVirtualBought.toString(),
      totalRealSpent: raw.totalRealSpent.toString(),
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
