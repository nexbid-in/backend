import { User } from "../../../../domain/entities/User";
import { Email } from "../../../../domain/value-objects/Email";

import { VerifyEmailDTO } from "../../../dto/request/auth/register.dto";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";

import { IVerifyEmailAndCreateAccountUseCase } from "../../../interface/use-cases/user/IVerifyEmailAndCreateAccountUseCase";
import { IOtpSessionService } from "../../../interface/services/IOtpSessionService";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IAuthTokenService } from "../../../interface/services/ITokenService";
import { IUniqueUserIdService } from "../../../interface/services/IUserIdGenerator";

import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";


export class VerifyEmailAndCreateAccountUseCase implements IVerifyEmailAndCreateAccountUseCase {
    private MAX_ATTEMPTS = 5;

    constructor(
        private readonly _otpRepo: IOtpSessionService,
        private readonly _otpService: IOtpService,
        private readonly _userRepo: IUserRepository,
        private readonly _userIdService: IUniqueUserIdService,
        private readonly _authTokenService: IAuthTokenService
    ) { }

    async execute(input: VerifyEmailDTO): Promise<AuthResponseDTO> {

        const emailVO = Email.create(input.email);

        const record = await this._otpRepo.get(emailVO.getValue());

        if (!record) {
            throw new AppError(ErrorCodes.OTP_EXPIRED);
        }

        if (record.attempts >= this.MAX_ATTEMPTS) {
            throw new AppError(ErrorCodes.OTP_TOO_MANY_ATTEMPTS);
        }

        const isValid = await this._otpService.compare(input.otp, record.otpHash);

        if (!isValid) {
            await this._otpRepo.incrementAttempts(emailVO.getValue());
            throw new AppError(ErrorCodes.OTP_INVALID);
        }

        const userId = await this._userIdService.generate(record.data.firstName);

        const user = User.create({
            id: userId,
            email: emailVO,
            firstName: record.data.firstName,
            lastName: record.data.lastName,
            password: record.data.passwordHash
        });

        await this._userRepo.save(user);

        const accessToken = this._authTokenService.generate({
            userId: user.id,
            email: user.email.getValue()
        });

        await this._otpRepo.delete(input.email);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email.getValue(),
                firstName: user.firstName,
                lastName: user.lastName
            }
        };

    }
}