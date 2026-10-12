import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { IAuthTokenService } from "../../../application/interface/services/ITokenService";
import { AuthTokenServiceDTO } from "../../../application/dto/internal/AuthTokenServiceDTO";
import { env } from "../../config/env";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";


export class AuthTokenService implements IAuthTokenService {
    generateAccessToken(payload: AuthTokenServiceDTO): string {
        return jwt.sign(
            payload,
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },

        );
    }

    generateRefreshToken(payload: AuthTokenServiceDTO): string {
        return jwt.sign(
            payload,
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
        );
    }

    verifyAccessToken(token: string): AuthTokenServiceDTO {
        try {
            return jwt.verify(token, env.JWT_SECRET) as AuthTokenServiceDTO;
        } catch (error) {
            if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
                throw new AppError(ErrorCodes.UNAUTHORIZED);
            }
            throw error;
        }
    }
    
    verifyRefreshToken(token: string): AuthTokenServiceDTO {
        try {
            return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenServiceDTO;
        } catch (error) {
            if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
                throw new AppError(ErrorCodes.UNAUTHORIZED);
            }
            throw error;
        }
    }
}