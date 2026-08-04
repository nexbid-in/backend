import { User } from "../../../../domain/entities/User";
import { IEmailOtpRepository } from "../../../../domain/repositories/user/IEmailOtpRepository";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { VerifyEmailDTO } from "../../../dto/request/auth/verify-email.dto";
import { UserRegisterResponseDTO } from "../../../dto/response/auth/register.dto";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IAuthTokenService } from "../../../interface/services/ITokenService";
import { IUniqueUserIdService } from "../../../interface/services/IUserIdGenerator";
import { IVerifyEmailOtpUseCse } from "../../../interface/use-cases/user/IVerifyEmailOtpUseCase";


export class VerifyEmailOtpUseCase implements IVerifyEmailOtpUseCse {
    private MAX_ATTEMPTS = 5;

    constructor(
        private readonly _otpRepo: IEmailOtpRepository,
        private readonly _otpService: IOtpService,
        private readonly _userRepo: IUserRepository,
        private readonly _userIdService: IUniqueUserIdService,
        private readonly _authTokenService: IAuthTokenService
    ) {}

    async execute(input: VerifyEmailDTO): Promise<UserRegisterResponseDTO> {

        const record = await this._otpRepo.get(input.email);

        if (!record) {
            throw new AppError(ErrorCodes.OTP_EXPIRED);
        }

        if (record.attempts >= this.MAX_ATTEMPTS) {
            await this._otpRepo.delete(input.email);
            throw new AppError(ErrorCodes.OTP_TOO_MANY_ATTEMPTS);
        }

        const isValid = await this._otpService.compare(input.otp, record.otpHash);

        if (!isValid) {
            await this._otpRepo.incrementAttempts(input.email);
            throw new AppError(ErrorCodes.OTP_INVALID);
        }

        const userId = await this._userIdService.generate(record.data.firstName);

        const user = User.create({
            id: userId,
            email: input.email,
            firstName: record.data.firstName,
            lastName: record.data.lastName,
            password: record.data.passwordHash
        });

        await this._userRepo.save(user);

        const accessToken = this._authTokenService.generate({
            userId: user.id,
            email: user.email
        });

        await this._otpRepo.delete(input.email);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };

    }
}