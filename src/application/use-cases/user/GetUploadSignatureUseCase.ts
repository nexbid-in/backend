import { IGetUploadSignatureUseCase } from "../../interface/use-cases/user/IGetUploadSignatureUseCase";
import {
  IUploadSignatureService,
  UploadSignatureResponseDTO,
} from "../../interface/services/IUploadSignatureService";

export class GetUploadSignatureUseCase implements IGetUploadSignatureUseCase {
  constructor(private readonly _signatureService: IUploadSignatureService) {}

  execute(folder?: string): Promise<UploadSignatureResponseDTO> {
    return Promise.resolve(this._signatureService.generateSignature(folder));
  }
}
