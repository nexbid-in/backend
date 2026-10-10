import { ResetPasswordDTO } from "../../../dto/auth/ResetPasswordDTO";

export interface IVerifyOtpAndResetPasswordUseCase {
    execute(input: ResetPasswordDTO): Promise<void>;
}
