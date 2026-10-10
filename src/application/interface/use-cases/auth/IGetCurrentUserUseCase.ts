import { GetCurrentUserResponseDTO, GetCurrentUserRequestDTO } from "../../../dto/auth/GetCurrentUserDTO";

export interface IGetCurrentUserUseCase {
    execute(data: GetCurrentUserRequestDTO): Promise<GetCurrentUserResponseDTO>
}