import { ForgotPasswordDTO } from "../../../dto/auth/ForgotPasswordDTO";

export interface ISendPasswordResetOtpUseCase {
    execute(input: ForgotPasswordDTO): Promise<void>;
}
