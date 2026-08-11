import { IUserRepository } from "../../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";
import { LoginUserDTO } from "../../../dto/request/auth/login.dto";
import { AuthResponseDTO } from "../../../dto/response/auth/auth-response.dto";
import { IPasswordHashService } from "../../../interface/services/IPasswordHashService";
import { IRateLimiter } from "../../../interface/services/IRateLimiter";
import { IAuthTokenService } from "../../../interface/services/ITokenService";
import { ILoginUserUseCase } from "../../../interface/use-cases/user/ILoginUserUseCase";

export class LoginUserUseCase implements ILoginUserUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _passwordHashService: IPasswordHashService,
        private readonly _authTokenService: IAuthTokenService,
        private readonly _rateLimiter: IRateLimiter
    ) {}

    async execute(input: LoginUserDTO): Promise<AuthResponseDTO> {
        const RATE_LIMIT_KEY = `rate_limit:login:${input.email}`;
        const isAllowed = await this._rateLimiter.incrementAndCheck(RATE_LIMIT_KEY, 5, 300);
        
        if (!isAllowed) {
            throw new AppError(ErrorCodes.LOGIN_RATE_LIMIT_EXCEEDED);
        }

        const user = await this._userRepo.findByEmail(input.email);
        if (!user) {
            throw new AppError(ErrorCodes.INVALID_CREDENTIALS);
        }

        const isPasswordValid = await this._passwordHashService.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new AppError(ErrorCodes.INVALID_CREDENTIALS);
        }

        if (user.isBlocked) {
            throw new AppError(ErrorCodes.ACCOUNT_BLOCKED);
        }

        const token = this._authTokenService.generate({
            userId: user.id,
            email: user.email
        });

        return {
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        }
    }
}