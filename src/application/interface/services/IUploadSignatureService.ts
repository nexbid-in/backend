export type UploadSignatureResponseDTO = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

export interface IUploadSignatureService {
  generateSignature(folder?: string): UploadSignatureResponseDTO;
}
