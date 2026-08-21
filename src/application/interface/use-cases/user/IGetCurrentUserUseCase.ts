import { GetCurrentUserResponseDTO } from "../../../dto/user/auth/GetCurrentUserResponseDTO";

export interface IGetCurrentUserUseCase {
    execute(id: string): Promise<GetCurrentUserResponseDTO>
}