import { User } from "../../../../domain/entities/User";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { IAuthTokenService } from "../../../interface/services/ITokenService";
import { IRegistrationTokenService } from "../../../interface/services/ITokenService";
import { IPinHashService } from "../../../interface/services/IPinService";
import { IUniqueUserIdService } from "../../../interface/services/IUserIdGenerator";
import { ICompleteRegistrationUseCase } from "../../../interface/use-cases/user/ICompleteRegistrationUseCase";
import { UserRegisterDTO } from "../../../dto/request/auth/register.dto";
import { UserRegisterResponseDTO } from "../../../dto/response/auth/register.dto";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";


export class CompleteRegistrationUseCase implements ICompleteRegistrationUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _pinService: IPinHashService,
        private readonly _userIdService: IUniqueUserIdService,
        private readonly _authTokenService: IAuthTokenService,
        private readonly _registrationTokenService: IRegistrationTokenService
    ) {}

    async execute(input: UserRegisterDTO): Promise<UserRegisterResponseDTO> {
        const { email } = this._registrationTokenService.verify(input.registrationToken);

        if (await this._userRepo.existsByMobile(input.mobile)) {
            throw new AppError(ErrorCodes.MOBILE_ALREADY_IN_USE);
        }

        const userId = await this._userIdService.generate(input.fullName);

        const pinHash = await this._pinService.hash(input.pin);

        const user = User.create({
            id: userId,
            email,
            mobile: input.mobile,
            fullName: input.fullName,
            dob: new Date(input.dob),
            pinHash,
        });
        

        await this._userRepo.save(user);

        const accessToken = this._authTokenService.generate({
            userId: user.id,
            email: user.email,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        }
    }
}


