import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { GetUsersQueryDTO, PaginatedUsersResponseDTO } from "../../dto/admin/GetUsersDTO";
import { IGetUsersUseCase } from "../../interface/use-cases/admin/IGetUsersUseCase";

export class GetUsersUseCase implements IGetUsersUseCase {
    constructor(
        private readonly _userRepo: IUserRepository
    ) {}

    async execute(query: GetUsersQueryDTO): Promise<PaginatedUsersResponseDTO> {
        const { data: users, total } = await this._userRepo.findManyWithFilters({
            page: query.page,
            limit: query.limit,
            search: query.search,
            status: query.status,
        });

        const userList = users.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email.getValue(),
            profileImage: user.profileImage,
            isBlocked: user.isBlocked,
            createdAt: user.createdAt,
        }));

        return {
            users: userList,
            pagination: {
                page: query.page,
                limit: query.limit,
                totalUsers: total,
                totalPages: Math.ceil(total / query.limit),
            }
        }
    }
}