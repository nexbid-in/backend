import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { AuthResponseDTO } from "../../dto/auth/AuthResponseDTO";
import { LoginUserDTO } from "../../dto/auth/LoginDTO";
import { IPasswordHashService } from "../../interface/services/IPasswordHashService";
import { IRateLimiter } from "../../interface/services/IRateLimiter";
import { ILoginUserUseCase } from "../../interface/use-cases/auth/ILoginUserUseCase";
import { AuthDTOMapper } from "../../mapper/auth/AuthDTOMapper";
import { AuthSessionService } from "../../services/auth/AuthSessionService";

/**
 * Orchestrates login rate-limit enforcement, credential/portal verification,
 * activity tracking, and session token issuance.
 */
export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _passwordHashService: IPasswordHashService,
    private readonly _authSessionService: AuthSessionService,
    private readonly _rateLimiter: IRateLimiter
  ) {}

  async execute(input: LoginUserDTO): Promise<AuthResponseDTO> {
    const email = Email.create(input.email).getValue();

    const isAllowed = await this._rateLimiter.incrementAndCheck(
      `rate_limit:login:${email}`,
      5,
      300
    );
    if (!isAllowed) {
      throw new AppError(ErrorCodes.LOGIN_RATE_LIMIT_EXCEEDED);
    }

    const user = await this._userRepo.findByEmail(email);
    if (!user || !user.password) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this._passwordHashService.compare(
      input.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS);
    }

    if (
      (input.portal === "ADMIN" && user.role !== "ADMIN") ||
      (input.portal === "USER" && user.role !== "USER")
    ) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    user.markAsActive();
    await this._userRepo.save(user);

    const { accessToken, refreshToken } =
      this._authSessionService.issueTokens(user);

    return AuthDTOMapper.toAuthResponse({ user, accessToken, refreshToken });
  }
}
