import { VerifyEmailDTO } from "../../../dto/request/auth/verify-email.dto";
import { UserRegisterResponseDTO } from "../../../dto/response/auth/register.dto";


export interface IVerifyEmailOtpUseCse {
    execute(input: VerifyEmailDTO): Promise<UserRegisterResponseDTO>;
}
