import { AuthResponseDTO } from "../../../dto/auth/AuthResponseDTO";

export type GoogleAuthDTO = {
  credential: string;
};

export interface IGoogleAuthUseCase {
  execute(input: GoogleAuthDTO): Promise<AuthResponseDTO>;
}
