import { Wallet, WalletStatus } from "../../../domain/entities/Wallet";
import { WalletPersistenceDTO, DecimalLike } from "../../dto/internal/WalletPersistenceDTO";

function toNum(val: DecimalLike): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class WalletPersistenceMapper {
  static toPrisma(wallet: Wallet): WalletPersistenceDTO {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      usedMargin: wallet.usedMargin,
      totalVirtualBought: wallet.totalVirtualBought,
      totalRealSpent: wallet.totalRealSpent,
      status: wallet.status,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  static toDomain(raw: WalletPersistenceDTO): Wallet {
    return Wallet.create({
      id: raw.id,
      userId: raw.userId,
      balance: toNum(raw.balance),
      usedMargin: toNum(raw.usedMargin),
      totalVirtualBought: toNum(raw.totalVirtualBought),
      totalRealSpent: toNum(raw.totalRealSpent),
      status: raw.status as WalletStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
