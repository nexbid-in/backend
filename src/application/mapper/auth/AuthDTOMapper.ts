import { User } from "../../../domain/entities/User";
import { AuthResponseDTO } from "../../dto/auth/AuthResponseDTO";
import { GetCurrentUserResponseDTO } from "../../dto/auth/GetCurrentUserDTO";

/**
 * Maps User domain entities and issued tokens into authentication response DTOs.
 */
export class AuthDTOMapper {
  static toUserSummary(user: User): GetCurrentUserResponseDTO {
    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImage: user.profileImage,
    };
  }

  static toAuthResponse(params: {
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
  }): AuthResponseDTO {
    const { user, accessToken, refreshToken, isNewUser } = params;

    return {
      accessToken,
      refreshToken,
      ...(isNewUser !== undefined ? { isNewUser } : {}),
      user: this.toUserSummary(user),
    };
  }
}
