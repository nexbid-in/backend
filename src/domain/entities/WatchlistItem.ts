import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";
import { Stock } from "./Stock";

export interface WatchlistItemProps {
  id: string;
  userId: string;
  stockId: string;
  order?: number;
  createdAt?: Date;
  stock?: Stock | null;
}

export class WatchlistItem {
  private constructor(
    private readonly props: {
      id: string;
      userId: string;
      stockId: string;
      order: number;
      createdAt: Date;
      stock?: Stock | null;
    }
  ) {}

  static create(props: WatchlistItemProps): WatchlistItem {
    if (!props.id || !props.userId || !props.stockId) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    return new WatchlistItem({
      id: props.id,
      userId: props.userId,
      stockId: props.stockId,
      order: props.order ?? 0,
      createdAt: props.createdAt ?? new Date(),
      stock: props.stock ?? null,
    });
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get stockId(): string { return this.props.stockId; }
  get order(): number { return this.props.order; }
  get createdAt(): Date { return this.props.createdAt; }
  get stock(): Stock | null | undefined { return this.props.stock; }
}
