import { Email } from "../../../domain/value-objects/Email";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { RegisterUserDTO } from "../../dto/auth/RegisterDTO";
import { IPasswordHashService } from "../../interface/services/IPasswordHashService";
import { IRegisterUserUseCase } from "../../interface/use-cases/auth/IRegisterUserUseCase";
import { OtpDispatchService } from "../../services/auth/OtpDispatchService";

/**
 * Orchestrates registration eligibility checks, password hashing, and OTP dispatch.
 */
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _passwordHashService: IPasswordHashService,
    private readonly _otpDispatchService: OtpDispatchService
  ) {}

  async execute(input: RegisterUserDTO): Promise<void> {
    const email = Email.create(input.email).getValue();

    const userExists = await this._userRepo.existsByEmail(email);
    if (userExists) {
      throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS);
    }

    await this._otpDispatchService.checkRateLimit(
      `rate_limit:otp:${email}`,
      5,
      900
    );

    const passwordHash = await this._passwordHashService.hash(input.password);

    await this._otpDispatchService.generateAndSendOtp({
      email,
      subject: "Your nexbid Registration OTP Code",
      sessionData: {
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      },
    });
  }
}
