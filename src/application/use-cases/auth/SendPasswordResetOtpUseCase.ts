import { Email } from "../../../domain/value-objects/Email";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { ForgotPasswordDTO } from "../../dto/auth/ForgotPasswordDTO";
import { ISendPasswordResetOtpUseCase } from "../../interface/use-cases/auth/ISendPasswordResetOtpUseCase";
import { OtpDispatchService } from "../../services/auth/OtpDispatchService";

/**
 * Orchestrates user existence validation and password-reset OTP dispatch.
 */
export class SendPasswordResetOtpUseCase
  implements ISendPasswordResetOtpUseCase
{
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _otpDispatchService: OtpDispatchService
  ) {}

  async execute(input: ForgotPasswordDTO): Promise<void> {
    const email = Email.create(input.email).getValue();

    const userExists = await this._userRepo.existsByEmail(email);
    if (!userExists) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    await this._otpDispatchService.checkRateLimit(
      `rate_limit:otp_reset:${email}`,
      3,
      900
    );

    await this._otpDispatchService.generateAndSendOtp({
      email,
      subject: "Your Password Reset OTP Code",
      sessionData: { purpose: "RESET_PASSWORD" },
    });
  }
}
