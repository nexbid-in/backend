import { InvalidEmailError } from "../../../../domain/errors/InvalidEmailError";
import { IEmailOtpRepository } from "../../../../domain/repositories/user/IEmailOtpRepository";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { Email } from "../../../../domain/value-objects/Email";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IEmailService } from "../../../interface/services/IEmailService";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IResendOtpInput, IResendOtpUseCase } from "../../../interface/use-cases/user/IResendOtpUseCase";


export class ResendOtpUseCase implements IResendOtpUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpRepo: IEmailOtpRepository,
        private readonly _otpService: IOtpService,
        private readonly _emailService: IEmailService
    ) {}

    async execute(input: IResendOtpInput): Promise<void> {
        try {
            const emailVO = Email.create(input.email);
            const email = emailVO.getValue();

            const userExists = await this._userRepo.existsByEmail(email);
            if (userExists) {
                throw new AppError(ErrorCodes.USER_ALREADY_EXISTS);
            }

            const otp = this._otpService.generate();
            const otpHash = await this._otpService.hash(otp);

            await this._otpRepo.save(email, otpHash);

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