import { LoginUserDTO } from "../../../dto/auth/LoginDTO";
import { AuthResponseDTO } from "../../../dto/auth/AuthResponseDTO";

export interface ILoginUserUseCase {
    execute(input: LoginUserDTO): Promise<AuthResponseDTO>;
}