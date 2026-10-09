import { AuthTokenServiceDTO } from "../../dto/internal/AuthTokenServiceDTO";

export interface IAuthTokenService {
    generateAccessToken(payload: AuthTokenServiceDTO): string;
    generateRefreshToken(payload: AuthTokenServiceDTO): string;
    verifyAccessToken(token: string): AuthTokenServiceDTO;
    verifyRefreshToken(token: string): AuthTokenServiceDTO;
}