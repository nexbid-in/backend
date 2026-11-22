import { IOrderRepository } from "../../../domain/repositories/trading/IOrderRepository";
import {
  AdminOrdersQueryDTO,
  PaginatedAdminOrdersResponseDTO,
} from "../../dto/admin/AdminOrderDTOs";
import { IGetAdminOrdersUseCase } from "../../interface/use-cases/admin/IGetAdminOrdersUseCase";

export class GetAdminOrdersUseCase implements IGetAdminOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(
    query: AdminOrdersQueryDTO
  ): Promise<PaginatedAdminOrdersResponseDTO> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (endDate && query.endDate && !query.endDate.includes("T")) {
      endDate.setHours(23, 59, 59, 999);
    }

    const { data: orders, total } = await this.orderRepo.findManyWithFilters({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      side: query.side,
      productType: query.productType,
      isAmo: query.isAmo,
      startDate,
      endDate,
    });

    return {
      orders,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalOrders: total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
