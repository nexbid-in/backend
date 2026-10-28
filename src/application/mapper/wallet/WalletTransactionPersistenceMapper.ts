import { WalletTransaction } from "../../../domain/entities/WalletTransaction";
import { WalletTransactionPersistenceDTO } from "../../dto/internal/WalletTransactionPersistenceDTO";
import { DecimalLike } from "../../dto/internal/WalletPersistenceDTO";

function toNum(val: DecimalLike): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

export class WalletTransactionPersistenceMapper {
  static toPrisma(tx: WalletTransaction): WalletTransactionPersistenceDTO {
    return {
      id: tx.id,
      walletId: tx.walletId,
      userId: tx.userId,
      referenceId: tx.referenceId,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      description: tx.description,
      metadata: tx.metadata ?? null,
      createdAt: tx.createdAt,
    };
  }

  static toDomain(raw: WalletTransactionPersistenceDTO): WalletTransaction {
    return WalletTransaction.create({
      id: raw.id,
      walletId: raw.walletId,
      userId: raw.userId,
      referenceId: raw.referenceId,
      type: raw.type,
      amount: toNum(raw.amount),
      balanceAfter: toNum(raw.balanceAfter),
      description: raw.description,
      metadata: raw.metadata as Record<string, unknown> | null,
      createdAt: raw.createdAt,
    });
  }
}
