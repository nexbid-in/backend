import { ResendOtpDTO } from "../../../dto/user/auth/RegisterDTO";

export interface IResendOtpUseCase {
    execute(input: ResendOtpDTO): Promise<void>;
}