import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IPasswordHashService } from "../../interface/services/IPasswordHashService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { ChangePasswordDTO } from "../../dto/user/ChangePasswordDTO";
import { IChangePasswordUseCase } from "../../interface/use-cases/user/IChangePasswordUseCase";

export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _passwordHashService: IPasswordHashService
  ) {}

  async execute(data: ChangePasswordDTO): Promise<void> {
    const user = await this._userRepo.findById(data.userId);

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
    }

    if (!user.password) {
      throw new AppError(ErrorCodes.PASSWORD_NOT_SET);
    }

    const isCurrentPasswordValid = await this._passwordHashService.compare(
      data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new AppError(ErrorCodes.INVALID_CURRENT_PASSWORD);
    }

    const isSamePassword = await this._passwordHashService.compare(
      data.newPassword,
      user.password
    );

    if (isSamePassword) {
      throw new AppError(ErrorCodes.NEW_PASSWORD_SAME_AS_CURRENT);
    }

    const newPasswordHash = await this._passwordHashService.hash(data.newPassword);
    user.updatePassword(newPasswordHash);

    await this._userRepo.save(user);
  }
}
