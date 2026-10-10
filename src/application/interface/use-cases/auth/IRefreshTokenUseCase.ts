import { RefreshTokenDTO, RefreshTokenResponseDTO } from "../../../dto/auth/RefreshTokenDTO";

export interface IRefreshTokenUseCase {
    execute(input: RefreshTokenDTO): Promise<RefreshTokenResponseDTO>;
}