import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  RefreshTokenDTO,
  RefreshTokenResponseDTO,
} from "../../dto/auth/RefreshTokenDTO";
import { IAuthTokenService } from "../../interface/services/ITokenService";
import { IRefreshTokenUseCase } from "../../interface/use-cases/auth/IRefreshTokenUseCase";
import { AuthSessionService } from "../../services/auth/AuthSessionService";

/**
 * Orchestrates refresh-token validation, active user checks, and token rotation.
 */
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _tokenService: IAuthTokenService,
    private readonly _authSessionService: AuthSessionService
  ) {}

  async execute(input: RefreshTokenDTO): Promise<RefreshTokenResponseDTO> {
    const payload = this._tokenService.verifyRefreshToken(input.refreshToken);

    const user = await this._userRepo.findById(payload.userId);
    if (!user || user.isBlocked) {
      throw new AppError(ErrorCodes.UNAUTHORIZED);
    }

    return this._authSessionService.issueTokens(user);
  }
}
