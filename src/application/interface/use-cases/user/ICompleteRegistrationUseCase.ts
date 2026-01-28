import { UserRegisterDTO } from "../../../dto/request/auth/register.dto";
import { UserRegisterResponseDTO } from "../../../dto/response/auth/register.dto";


export interface ICompleteRegistrationUseCase {
  execute(input: UserRegisterDTO): Promise<UserRegisterResponseDTO>;
}
