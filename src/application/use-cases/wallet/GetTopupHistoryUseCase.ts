import { IGetTopupHistoryUseCase } from "../../interface/use-cases/wallet/IGetTopupHistoryUseCase";
import {
  GetTopupHistoryQueryDTO,
  PaginatedTopupHistoryResponseDTO,
} from "../../dto/wallet/GetTopupHistoryDTO";
import { IPaymentOrderRepository } from "../../../domain/repositories/payment/IPaymentOrderRepository";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GetTopupHistoryUseCase implements IGetTopupHistoryUseCase {
  constructor(
    private readonly _paymentOrderRepo: IPaymentOrderRepository,
    private readonly _userRepo: IUserRepository
  ) {}

  async execute(query: GetTopupHistoryQueryDTO): Promise<PaginatedTopupHistoryResponseDTO> {
    const user = await this._userRepo.findById(query.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    const { data: records, total } = await this._paymentOrderRepo.findHistory({
      userId: query.userId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const orders = records.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      paymentId: order.paymentId,
      realAmount: order.realAmount,
      virtualAmount: order.virtualAmount,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      orders,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalOrders: total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}
