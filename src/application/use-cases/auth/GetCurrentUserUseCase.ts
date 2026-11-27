import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  GetCurrentUserRequestDTO,
  GetCurrentUserResponseDTO,
} from "../../dto/auth/GetCurrentUserDTO";
import { IGetCurrentUserUseCase } from "../../interface/use-cases/auth/IGetCurrentUserUseCase";
import { AuthDTOMapper } from "../../mapper/auth/AuthDTOMapper";

/**
 * Orchestrates retrieving the authenticated user's active session profile.
 */
export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
  constructor(private readonly _userRepo: IUserRepository) {}

  async execute(
    data: GetCurrentUserRequestDTO
  ): Promise<GetCurrentUserResponseDTO> {
    const user = await this._userRepo.findById(data.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    return AuthDTOMapper.toUserSummary(user);
  }
}
