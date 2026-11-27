import { User } from "../../../domain/entities/User";
import { IAuthTokenService } from "../../interface/services/ITokenService";

/**
 * Issues access and refresh JWT token pairs for authenticated user entities.
 */
export class AuthSessionService {
  constructor(private readonly tokenService: IAuthTokenService) {}

  issueTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email.getValue(),
      role: user.role,
    };

    return {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };
  }
}
