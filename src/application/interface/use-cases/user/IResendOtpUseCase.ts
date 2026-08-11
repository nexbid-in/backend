import { ResendOtpDTO } from "../../../dto/request/auth/register.dto";

export interface IResendOtpUseCase {
    execute(input: ResendOtpDTO): Promise<void>;
}