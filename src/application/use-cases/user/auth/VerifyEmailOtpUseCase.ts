import { IEmailOtpRepository } from "../../../../domain/repositories/user/IEmailOtpRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IRegistrationTokenService } from "../../../interface/services/ITokenService";
import { IVerifyEmailOtpInput, IVerifyEmailOtpOutput, IVerifyEmailOtpUseCse } from "../../../interface/use-cases/user/IVerifyEmailOtpUseCase";


export class VerifyEmailOtpUseCase implements IVerifyEmailOtpUseCse {
    private MAX_ATTEMPTS = 5;

    constructor(
        private readonly otpRepo: IEmailOtpRepository,
        private readonly otpService: IOtpService,
        private readonly tokenService: IRegistrationTokenService
    ) {}

    async execute(input: IVerifyEmailOtpInput): Promise<IVerifyEmailOtpOutput> {

        const record = await this.otpRepo.get(input.email);

        if (!record) {
            throw new AppError(ErrorCodes.OTP_EXPIRED);
        }

        if (record.attempts >= this.MAX_ATTEMPTS) {
            await this.otpRepo.delete(input.email);
            throw new AppError(ErrorCodes.OTP_TOO_MANY_ATTEMPTS);
        }

        const isValid = await this.otpService.compare(input.otp, record.otpHash);

        if (!isValid) {
            await this.otpRepo.incrementAttempts(input.email);
            throw new AppError(ErrorCodes.OTP_INVALID);
        }

        await this.otpRepo.delete(input.email);

        return {
            registrationToken: this.tokenService.generate(input.email),
        };

    }
}