import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { AuthResponseDTO } from "../../dto/auth/AuthResponseDTO";
import {
  GooglePayloadDTO,
  IGoogleAuthService,
} from "../../interface/services/IGoogleAuthService";
import { IUniqueUserIdService } from "../../interface/services/IUserIdGenerator";
import {
  GoogleAuthDTO,
  IGoogleAuthUseCase,
} from "../../interface/use-cases/auth/IGoogleAuthUseCase";
import { AuthDTOMapper } from "../../mapper/auth/AuthDTOMapper";
import { AuthSessionService } from "../../services/auth/AuthSessionService";

/**
 * Orchestrates Google ID token verification, account linking or creation,
 * and session token issuance.
 */
export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    private readonly _googleAuthService: IGoogleAuthService,
    private readonly _userRepo: IUserRepository,
    private readonly _userIdService: IUniqueUserIdService,
    private readonly _authSessionService: AuthSessionService
  ) {}

  async execute(input: GoogleAuthDTO): Promise<AuthResponseDTO> {
    const googleUser = await this._googleAuthService.verifyIdToken(
      input.credential
    );

    const { user, isNewUser } = await this.resolveUser(googleUser);
    const { accessToken, refreshToken } =
      this._authSessionService.issueTokens(user);

    return AuthDTOMapper.toAuthResponse({
      user,
      accessToken,
      refreshToken,
      isNewUser,
    });
  }

  private async resolveUser(
    googleUser: GooglePayloadDTO
  ): Promise<{ user: User; isNewUser: boolean }> {
    const existing = await this._userRepo.findByEmail(googleUser.email);

    if (existing) {
      if (existing.isBlocked) {
        throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
      }

      if (!existing.googleId) {
        existing.linkGoogleAccount(
          googleUser.googleId,
          googleUser.profileImage
        );
      }

      existing.markAsActive();
      await this._userRepo.save(existing);
      return { user: existing, isNewUser: false };
    }

    const userId = await this._userIdService.generate(googleUser.firstName);
    const newUser = User.create({
      id: userId,
      email: Email.create(googleUser.email),
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      profileImage: googleUser.profileImage,
      googleId: googleUser.googleId,
      password: null,
    });

    await this._userRepo.save(newUser);
    return { user: newUser, isNewUser: true };
  }
}
