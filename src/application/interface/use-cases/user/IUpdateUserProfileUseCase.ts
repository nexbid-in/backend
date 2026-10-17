import {
  UpdateUserProfileRequestDTO,
  UpdateUserProfileResponseDTO,
} from "../../../dto/user/UpdateUserProfileDTO";

export interface IUpdateUserProfileUseCase {
  execute(data: UpdateUserProfileRequestDTO): Promise<UpdateUserProfileResponseDTO>;
}
