import { GetUsersQueryDTO, PaginatedUsersResponseDTO } from "../../../dto/admin/GetUsersDTO";

export interface IGetUsersUseCase {
    execute(query: GetUsersQueryDTO): Promise<PaginatedUsersResponseDTO>;
}