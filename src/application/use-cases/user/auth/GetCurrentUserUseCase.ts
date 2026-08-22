import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { GetCurrentUserResponseDTO } from "../../../dto/user/auth/GetCurrentUserResponseDTO";
import { IGetCurrentUserUseCase } from "../../../interface/use-cases/user/IGetCurrentUserUseCase";

export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
    constructor(
        private readonly _userRepo: IUserRepository 
    ) {}

    async execute(id: string): Promise<GetCurrentUserResponseDTO> {
        const user = await this._userRepo.findById(id);

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND);
        }

        return {
            id: user.id,
            email: user.email.getValue(),
            firstName: user.firstName,
            lastName: user.lastName
        };
    }
}