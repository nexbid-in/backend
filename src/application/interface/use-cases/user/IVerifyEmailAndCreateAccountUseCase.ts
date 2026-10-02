import { VerifyEmailDTO } from "../../../dto/user/auth/RegisterDTO";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";


export interface IVerifyEmailAndCreateAccountUseCase {
    execute(input: VerifyEmailDTO): Promise<AuthResponseDTO>;
}
