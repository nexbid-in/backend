import { Email } from "../../../../domain/value-objects/Email";
import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { IEmailOtpRepository } from "../../../../domain/repositories/user/IEmailOtpRepository";
import { IOtpService } from "../../../interface/services/IOtpService";
import { IEmailService } from "../../../interface/services/IEmailService";
import { IUserRegistrationUseCase } from "../../../interface/use-cases/user/IUserRegistrationUseCase";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { InvalidEmailError } from "../../../../domain/errors/InvalidEmailError";
import { IPinHashService } from "../../../interface/services/IPinService";
import { UserRegisterDTO } from "../../../dto/request/auth/register.dto";


export class StartEmailRegistrationUseCase implements IUserRegistrationUseCase {
    constructor(
        private _userRepo: IUserRepository,
        private _otpReop: IEmailOtpRepository,
        private _otpService: IOtpService,
        private _emailService: IEmailService,
        private _passwordHashService: IPinHashService

    ) { }

    async execute(input: UserRegisterDTO): Promise<void> {

        try {
            const emailVO = Email.create(input.email);

            const email = emailVO.getValue();

            const userExists = await this._userRepo.existsByEmail(email);

            if (userExists) {
                throw new AppError(ErrorCodes.USER_ALREADY_EXISTS);
            }

            const passwordHash = await this._passwordHashService.hash(input.password);

            const otp = this._otpService.generate();
            const otpHash = await this._otpService.hash(otp);

            await this._otpReop.save(email, otpHash, {
                firstName: input.firstName,
                lastName: input.lastName,
                passwordHash: passwordHash
            });

            const subject = "Your nexbid Registration OTP Code";

            await this._emailService.sendOtp(email, subject, otp);
        } catch (err) {
            if (err instanceof InvalidEmailError) {
                throw new AppError(ErrorCodes.INVALID_EMAIL);
            }

            throw err;
        }

    }
}