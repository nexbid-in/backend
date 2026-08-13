import { LoginUserDTO } from "../../../dto/user/auth/LoginDTO";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";

export interface ILoginUserUseCase {
    execute(input: LoginUserDTO): Promise<AuthResponseDTO>;
}