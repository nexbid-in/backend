import { GetCurrentUserResponseDTO } from "../../../dto/auth/GetCurrentUserResponseDTO";

export interface IGetCurrentUserUseCase {
    execute(id: string): Promise<GetCurrentUserResponseDTO>
}