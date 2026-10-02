import { Email } from "../../../../domain/value-objects/Email";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { IOtpSessionService } from "../../../interface/services/IOtpSessionService";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IEmailService } from "../../../interface/services/IEmailService";
import { IRegisterUserUseCase } from "../../../interface/use-cases/user/IRegisterUserUseCase";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { IPasswordHashService } from "../../../interface/services/IPasswordHashService";
import { RegisterUserDTO } from "../../../dto/user/auth/RegisterDTO";
import { IRateLimiter } from "../../../interface/services/IRateLimiter";


export class RegisterUserUseCase implements IRegisterUserUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _otpRepo: IOtpSessionService,
        private readonly _otpService: IOtpService,
        private readonly _emailService: IEmailService,
        private readonly _passwordHashService: IPasswordHashService,
        private readonly _rateLimiter: IRateLimiter,

    ) { }

    async execute(input: RegisterUserDTO): Promise<void> {

        const emailVO = Email.create(input.email);

        const email = emailVO.getValue();

        const userExists = await this._userRepo.existsByEmail(email);

        if (userExists) {
            throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS);
        }

        const RATE_LIMIT_KEY = `rate_limit:otp:${email}`;
        const isAllowed = await this._rateLimiter.incrementAndCheck(RATE_LIMIT_KEY, 5, 900);

        if (!isAllowed) {
            throw new AppError(ErrorCodes.OTP_RATE_LIMIT_EXCEEDED);
        }

        const passwordHash = await this._passwordHashService.hash(input.password);

        const otp = this._otpService.generate();
        const otpHash = await this._otpService.hash(otp);

        await this._otpRepo.save(email, otpHash, {
            firstName: input.firstName,
            lastName: input.lastName,
            passwordHash: passwordHash
        });

        const subject = "Your nexbid Registration OTP Code";

        await this._emailService.sendOtp(email, subject, otp);
    }
}