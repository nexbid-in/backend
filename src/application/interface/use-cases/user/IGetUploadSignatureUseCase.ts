import { UploadSignatureResponseDTO } from "../../services/IUploadSignatureService";

export interface IGetUploadSignatureUseCase {
  execute(folder?: string): Promise<UploadSignatureResponseDTO>;
}
