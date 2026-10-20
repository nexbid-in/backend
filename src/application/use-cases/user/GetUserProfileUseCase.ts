import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { GetUserProfileRequestDTO, GetUserProfileResponseDTO } from "../../dto/user/GetUserProfileDTO";
import { IGetUserProfileUseCase } from "../../interface/use-cases/user/IGetUserProfileUseCase";

export class GetUserProfileUseCase implements IGetUserProfileUseCase {
    constructor(private readonly _userRepo: IUserRepository) { }

    async execute(data: GetUserProfileRequestDTO): Promise<GetUserProfileResponseDTO> {
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
            mobile: user.mobile,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            hasPassword: !!user.password,
            isGoogleLinked: !!user.googleId,
        };
    }
}
