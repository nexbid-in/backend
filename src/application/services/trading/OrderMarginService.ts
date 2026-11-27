import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IWalletRepository } from "../../../domain/repositories/wallet/IWalletRepository";
import { PlaceOrderRequestDTO } from "../../dto/trading/OrderDTOs";
import { OrderSide, OrderType, ProductType } from "../../../domain/entities/trading/Order";
import { PositionSide } from "../../../domain/entities/trading/Position";
import { MarginCalculatorService } from "./MarginCalculatorService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class OrderMarginService {
  constructor(
    private readonly positionRepo: IPositionRepository,
    private readonly walletRepo: IWalletRepository
  ) {}

  async validateAndHoldMargin(
    dto: PlaceOrderRequestDTO,
    cleanSymbol: string,
    referencePrice: number
  ): Promise<number> {
    const existingPosition = await this.positionRepo.findByUserAndSymbol(
      dto.userId,
      cleanSymbol,
      dto.productType
    );

    const isCoveringPosition =
      existingPosition &&
      existingPosition.isOpen() &&
      ((existingPosition.side === PositionSide.LONG && dto.side === OrderSide.SELL) ||
        (existingPosition.side === PositionSide.SHORT && dto.side === OrderSide.BUY));

    let requiredMargin = 0;
    if (!isCoveringPosition) {
      requiredMargin = MarginCalculatorService.calculateRequiredMargin(
        dto.productType,
        dto.quantity,
        referencePrice
      );
    }

    const wallet = await this.walletRepo.findOrCreateByUserId(dto.userId);
    if (!wallet.isActive()) {
      throw new AppError(ErrorCodes.WALLET_FROZEN);
    }

    if (requiredMargin > 0) {
      if (wallet.availableMargin.isLessThan(requiredMargin)) {
        throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS);
      }

      if (dto.productType === ProductType.MIS || dto.orderType === OrderType.LIMIT) {
        wallet.blockMargin(requiredMargin);
        await this.walletRepo.update(wallet);
      }
    }

    return requiredMargin;
  }

  async releaseMargin(userId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }
    const wallet = await this.walletRepo.findByUserId(userId);
    if (!wallet) {
      return;
    }
    wallet.releaseMargin(amount);
    await this.walletRepo.update(wallet);
  }
}
