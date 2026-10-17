import { GetUserProfileRequestDTO, GetUserProfileResponseDTO } from "../../../dto/user/GetUserProfileDTO";

export interface IGetUserProfileUseCase {
    execute(data: GetUserProfileRequestDTO): Promise<GetUserProfileResponseDTO>;
}
