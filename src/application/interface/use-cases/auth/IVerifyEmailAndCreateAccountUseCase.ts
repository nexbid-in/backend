import { VerifyEmailDTO } from "../../../dto/auth/RegisterDTO";
import { AuthResponseDTO } from "../../../dto/auth/AuthResponseDTO";


export interface IVerifyEmailAndCreateAccountUseCase {
    execute(input: VerifyEmailDTO): Promise<AuthResponseDTO>;
}
