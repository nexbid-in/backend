import { IGoogleAuthUseCase, GoogleAuthDTO } from "../../interface/use-cases/auth/IGoogleAuthUseCase";
import { IGoogleAuthService } from "../../interface/services/IGoogleAuthService";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IAuthTokenService } from "../../interface/services/ITokenService";
import { IUniqueUserIdService } from "../../interface/services/IUserIdGenerator";
import { AuthResponseDTO } from "../../dto/auth/AuthResponseDTO";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    private readonly _googleAuthService: IGoogleAuthService,
    private readonly _userRepo: IUserRepository,
    private readonly _userIdService: IUniqueUserIdService,
    private readonly _authTokenService: IAuthTokenService
  ) {}

  async execute(input: GoogleAuthDTO): Promise<AuthResponseDTO> {
    const googleUser = await this._googleAuthService.verifyIdToken(input.credential);

    let user = await this._userRepo.findByEmail(googleUser.email);
    let isNewUser = false;

    if (user) {
      if (user.isBlocked) {
        throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
      }

      if (!user.googleId) {
        user.linkGoogleAccount(googleUser.googleId, googleUser.profileImage);
      }

      user.markAsActive();
      await this._userRepo.save(user);
    } else {
      isNewUser = true;
      const userId = await this._userIdService.generate(googleUser.firstName);

      user = User.create({
        id: userId,
        email: Email.create(googleUser.email),
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        profileImage: googleUser.profileImage,
        googleId: googleUser.googleId,
        password: null,
      });

      await this._userRepo.save(user);
    }

    const payload = {
      userId: user.id,
      email: user.email.getValue(),
      role: user.role,
    };

    const accessToken = this._authTokenService.generateAccessToken(payload);
    const refreshToken = this._authTokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
