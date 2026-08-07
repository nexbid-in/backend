import { InvalidEmailError } from "../../../../domain/errors/InvalidEmailError";
import { IRedisTempUserRepository } from "../../../../domain/repositories/user/IRedisTempUserRepository";
import { Email } from "../../../../domain/value-objects/Email";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IEmailService } from "../../../interface/services/IEmailService";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IRedisRateLimiter } from "../../../interface/services/IRedisRateLimiter";
import { IResendOtpInput, IResendOtpUseCase } from "../../../interface/use-cases/user/IResendOtpUseCase";


export class ResendOtpUseCase implements IResendOtpUseCase {
    constructor(
        private readonly _otpRepo: IRedisTempUserRepository,
        private readonly _otpService: IOtpService,
        private readonly _emailService: IEmailService,
        private readonly _rateLimiter: IRedisRateLimiter,
    ) { }

    async execute(input: IResendOtpInput): Promise<void> {
        try {
            const emailVO = Email.create(input.email);
            const email = emailVO.getValue();

            const RATE_LIMIT_KEY = `rate_limit:otp:${email}`;
            const isAllowed = await this._rateLimiter.incrementAndCheck(RATE_LIMIT_KEY, 5, 900);

            if (!isAllowed) {
                throw new AppError(ErrorCodes.OTP_RATE_LIMIT_EXCEEDED);
            }

            const existingRecord = await this._otpRepo.get(email);

            if (!existingRecord) {
                throw new AppError(ErrorCodes.OTP_EXPIRED);
            }

            const otp = this._otpService.generate();
            const otpHash = await this._otpService.hash(otp);

            await this._otpRepo.save(email, otpHash, existingRecord.data);

            const subject = "Your nexbid Registration OTP Code (Resent)";

            await this._emailService.sendOtp(email, subject, otp);
        } catch (err) {
            if (err instanceof InvalidEmailError) {
                throw new AppError(ErrorCodes.INVALID_EMAIL);
            }

            throw err;
        }
    }
}