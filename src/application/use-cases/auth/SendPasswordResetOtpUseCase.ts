import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IOtpSessionService } from "../../interface/services/IOtpSessionService";
import { IOtpService } from "../../interface/services/IOtpService";
import { IEmailService } from "../../interface/services/IEmailService";
import { IRateLimiter } from "../../interface/services/IRateLimiter";
import { ISendPasswordResetOtpUseCase } from "../../interface/use-cases/auth/ISendPasswordResetOtpUseCase";
import { ForgotPasswordDTO } from "../../dto/auth/ForgotPasswordDTO";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { Email } from "../../../domain/value-objects/Email";

export class SendPasswordResetOtpUseCase implements ISendPasswordResetOtpUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpRepo: IOtpSessionService,
        private readonly _otpService: IOtpService,
        private readonly _emailService: IEmailService,
        private readonly _rateLimiter: IRateLimiter,
    ) { }

    async execute(input: ForgotPasswordDTO): Promise<void> {
        const emailVO = Email.create(input.email);
        const email = emailVO.getValue();

        const user = await this._userRepo.existsByEmail(email);
        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND);
        }

        const RATE_LIMIT_KEY = `rate_limit:otp_reset:${email}`;
        const isAllowed = await this._rateLimiter.incrementAndCheck(RATE_LIMIT_KEY, 3, 900);

        if (!isAllowed) {
            throw new AppError(ErrorCodes.OTP_RATE_LIMIT_EXCEEDED);
        }

        const otp = this._otpService.generate();
        const otpHash = await this._otpService.hash(otp);

        await this._otpRepo.save(email, otpHash, { purpose: "RESET_PASSWORD" });

        const subject = "Your Password Reset OTP Code";
        await this._emailService.sendOtp(email, subject, otp);
    }
}
