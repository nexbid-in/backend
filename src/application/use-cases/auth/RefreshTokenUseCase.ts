import { IRefreshTokenUseCase } from "../../interface/use-cases/auth/IRefreshTokenUseCase";
import { RefreshTokenDTO, RefreshTokenResponseDTO } from "../../dto/auth/RefreshTokenDTO";
import { IAuthTokenService } from "../../interface/services/ITokenService";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class RefreshTokenUseCase implements IRefreshTokenUseCase {
    constructor(
        private readonly _userRepo: IUserRepository,
        private readonly _tokenService: IAuthTokenService
    ) { }

    async execute(input: RefreshTokenDTO): Promise<RefreshTokenResponseDTO> {

        const payload = this._tokenService.verifyRefreshToken(input.refreshToken);

        const user = await this._userRepo.findById(payload.userId);
        if (!user || user.isBlocked) {
            throw new AppError(ErrorCodes.UNAUTHORIZED);
        }

        const newPayload = {
            userId: user.id,
            email: user.email.getValue(),
            role: user.role,
        };

        const accessToken = this._tokenService.generateAccessToken(newPayload);
        const refreshToken = this._tokenService.generateRefreshToken(newPayload);

        return {
            accessToken,
            refreshToken,
        }
    }
}