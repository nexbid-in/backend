import { ResendOtpDTO } from "../../../dto/auth/RegisterDTO";

export interface IResendOtpUseCase {
    execute(input: ResendOtpDTO): Promise<void>;
}