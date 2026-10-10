import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { GetCurrentUserResponseDTO, GetCurrentUserRequestDTO } from "../../dto/auth/GetCurrentUserDTO";
import { IGetCurrentUserUseCase } from "../../interface/use-cases/auth/IGetCurrentUserUseCase";

export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
    constructor(
        private readonly _userRepo: IUserRepository 
    ) {}

    async execute(data: GetCurrentUserRequestDTO): Promise<GetCurrentUserResponseDTO> {
        const user = await this._userRepo.findById(data.userId);

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND);
        }

        if (user.isBlocked) {
            throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
        }

        return {
            id: user.id,
            email: user.email.getValue(),
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        };
    }
}