import {
  VerifyTopupPaymentRequestDTO,
  VerifyTopupPaymentResponseDTO,
} from "../../../dto/wallet/VerifyTopupPaymentDTO";

export interface IVerifyTopupPaymentUseCase {
  execute(data: VerifyTopupPaymentRequestDTO): Promise<VerifyTopupPaymentResponseDTO>;
}
