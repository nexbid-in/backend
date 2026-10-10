import jwt from "jsonwebtoken";
import { IAuthTokenService } from "../../../application/interface/services/ITokenService";
import { AuthTokenServiceDTO } from "../../../application/dto/internal/AuthTokenServiceDTO";
import { env } from "../../config/env";


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
        return jwt.verify(token, env.JWT_SECRET) as AuthTokenServiceDTO;
    }

    verifyRefreshToken(token: string): AuthTokenServiceDTO {
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenServiceDTO;
    }
}