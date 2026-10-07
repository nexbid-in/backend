import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { UpdateUserStatusDTO } from "../../dto/admin/UpdateUserStatusDTO";
import { IUpdateUserStatusUseCase } from "../../interface/use-cases/admin/IUpdateUserStatusUseCase";

export class UpdateUserStatusUseCase implements IUpdateUserStatusUseCase {
    constructor(
        private readonly _userRepo: IUserRepository
    ) {}

    async execute(input: UpdateUserStatusDTO): Promise<void> {
        const user = await this._userRepo.findById(input.userId);

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND);
        }

        if (user.isBlocked) {
            user.unblock();
        } else {
            user.block();
        }

        await this._userRepo.save(user);
    }
}