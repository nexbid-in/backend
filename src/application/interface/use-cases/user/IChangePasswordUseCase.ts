import { ChangePasswordDTO } from "../../../dto/user/ChangePasswordDTO";

export interface IChangePasswordUseCase {
  execute(data: ChangePasswordDTO): Promise<void>;
}
