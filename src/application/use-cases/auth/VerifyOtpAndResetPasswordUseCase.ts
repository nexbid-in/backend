import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { ResetPasswordDTO } from "../../dto/auth/ResetPasswordDTO";
import { IPasswordHashService } from "../../interface/services/IPasswordHashService";
import { IVerifyOtpAndResetPasswordUseCase } from "../../interface/use-cases/auth/IVerifyOtpAndResetPasswordUseCase";
import { OtpVerificationService } from "../../services/auth/OtpVerificationService";

/**
 * Orchestrates reset-password OTP verification, password hashing/update, and OTP cleanup.
 */
export class VerifyOtpAndResetPasswordUseCase
  implements IVerifyOtpAndResetPasswordUseCase
{
  constructor(
    private readonly _otpVerificationService: OtpVerificationService,
    private readonly _userRepo: IUserRepository,
    private readonly _passwordHashService: IPasswordHashService
  ) {}

  async execute(input: ResetPasswordDTO): Promise<void> {
    const email = Email.create(input.email).getValue();

    await this._otpVerificationService.verify({
      email,
      otp: input.otp,
      expectedPurpose: "RESET_PASSWORD",
    });

    const user = await this._userRepo.findByEmail(email);
    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    const passwordHash = await this._passwordHashService.hash(input.password);
    user.updatePassword(passwordHash);

    await this._userRepo.save(user);
    await this._otpVerificationService.consume(email);
  }
}
