import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { AuthResponseDTO } from "../../dto/auth/AuthResponseDTO";
import { VerifyEmailDTO } from "../../dto/auth/RegisterDTO";
import { IUniqueUserIdService } from "../../interface/services/IUserIdGenerator";
import { IVerifyEmailAndCreateAccountUseCase } from "../../interface/use-cases/auth/IVerifyEmailAndCreateAccountUseCase";
import { AuthDTOMapper } from "../../mapper/auth/AuthDTOMapper";
import { AuthSessionService } from "../../services/auth/AuthSessionService";
import { OtpVerificationService } from "../../services/auth/OtpVerificationService";

/**
 * Orchestrates OTP verification, account creation, OTP consumption, and session issuance.
 */
export class VerifyEmailAndCreateAccountUseCase
  implements IVerifyEmailAndCreateAccountUseCase
{
  constructor(
    private readonly _otpVerificationService: OtpVerificationService,
    private readonly _userRepo: IUserRepository,
    private readonly _userIdService: IUniqueUserIdService,
    private readonly _authSessionService: AuthSessionService
  ) {}

  async execute(input: VerifyEmailDTO): Promise<AuthResponseDTO> {
    const emailVO = Email.create(input.email);
    const email = emailVO.getValue();

    const sessionData = await this._otpVerificationService.verify({
      email,
      otp: input.otp,
    });

    if (
      !sessionData ||
      !sessionData.firstName ||
      !sessionData.lastName ||
      !sessionData.passwordHash
    ) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED);
    }

    const userId = await this._userIdService.generate(sessionData.firstName);

    const user = User.create({
      id: userId,
      email: emailVO,
      firstName: sessionData.firstName,
      lastName: sessionData.lastName,
      password: sessionData.passwordHash,
    });

    await this._userRepo.save(user);
    await this._otpVerificationService.consume(email);

    const { accessToken, refreshToken } =
      this._authSessionService.issueTokens(user);

    return AuthDTOMapper.toAuthResponse({ user, accessToken, refreshToken });
  }
}
