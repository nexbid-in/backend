import { v2 as cloudinary } from "cloudinary";
import {
  IUploadSignatureService,
  UploadSignatureResponseDTO,
} from "../../../application/interface/services/IUploadSignatureService";
import { env } from "../../config/env";

export class CloudinarySignatureService implements IUploadSignatureService {
  generateSignature(folder: string = "nexbid/profiles"): UploadSignatureResponseDTO {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder,
    };
  }
}
