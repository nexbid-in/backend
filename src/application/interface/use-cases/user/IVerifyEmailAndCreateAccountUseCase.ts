import { VerifyEmailDTO } from "../../../dto/request/auth/register.dto";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";


export interface IVerifyEmailAndCreateAccountUseCase {
    execute(input: VerifyEmailDTO): Promise<AuthResponseDTO>;
}
