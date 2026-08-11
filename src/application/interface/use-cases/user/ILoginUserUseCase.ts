import { LoginUserDTO } from "../../../dto/request/auth/login.dto";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";

export interface ILoginUserUseCase {
    execute(input: LoginUserDTO): Promise<AuthResponseDTO>;
}