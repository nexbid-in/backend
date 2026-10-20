import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import {
  UpdateUserProfileRequestDTO,
  UpdateUserProfileResponseDTO,
} from "../../dto/user/UpdateUserProfileDTO";
import { IUpdateUserProfileUseCase } from "../../interface/use-cases/user/IUpdateUserProfileUseCase";

export class UpdateUserProfileUseCase implements IUpdateUserProfileUseCase {
  constructor(private readonly _userRepo: IUserRepository) {}

  async execute(data: UpdateUserProfileRequestDTO): Promise<UpdateUserProfileResponseDTO> {
    const user = await this._userRepo.findById(data.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    user.updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile,
      profileImage: data.profileImage,
    });

    await this._userRepo.save(user);

    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      hasPassword: !!user.password,
      isGoogleLinked: !!user.googleId,
    };
  }
}
