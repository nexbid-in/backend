import { IVerifyOtpAndResetPasswordUseCase } from "../../interface/use-cases/auth/IVerifyOtpAndResetPasswordUseCase";
import { ResetPasswordDTO } from "../../dto/auth/ResetPasswordDTO";
import { IOtpSessionService } from "../../interface/services/IOtpSessionService";
import { IOtpService } from "../../interface/services/IOtpService";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IPasswordHashService } from "../../interface/services/IPasswordHashService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { Email } from "../../../domain/value-objects/Email";

export class VerifyOtpAndResetPasswordUseCase implements IVerifyOtpAndResetPasswordUseCase {
    private MAX_ATTEMPTS = 5;

    constructor(
        private readonly _otpRepo: IOtpSessionService,
        private readonly _otpService: IOtpService,
        private readonly _userRepo: IUserRepository,
        private readonly _passwordHashService: IPasswordHashService
    ) { }

    async execute(input: ResetPasswordDTO): Promise<void> {
        const emailVO = Email.create(input.email);
        const email = emailVO.getValue();

        const record = await this._otpRepo.get(email);

        if (!record || record.data?.purpose !== "RESET_PASSWORD") {
            throw new AppError(ErrorCodes.OTP_EXPIRED);
        }

        if (record.attempts >= this.MAX_ATTEMPTS) {
            throw new AppError(ErrorCodes.OTP_TOO_MANY_ATTEMPTS);
        }

        const isValid = await this._otpService.compare(input.otp, record.otpHash);

        if (!isValid) {
            await this._otpRepo.incrementAttempts(email);
            throw new AppError(ErrorCodes.OTP_INVALID);
        }

        const user = await this._userRepo.findByEmail(email);

        if (!user) {
            throw new AppError(ErrorCodes.NOT_FOUND);
        }

        const passwordHash = await this._passwordHashService.hash(input.password);
        
        user.updatePassword(passwordHash);

        await this._userRepo.save(user);

        await this._otpRepo.delete(email);
    }
}
