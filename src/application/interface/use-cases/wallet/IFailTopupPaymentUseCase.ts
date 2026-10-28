import {
  FailTopupPaymentRequestDTO,
  FailTopupPaymentResponseDTO,
} from "../../../dto/wallet/FailTopupPaymentDTO";

export interface IFailTopupPaymentUseCase {
  execute(data: FailTopupPaymentRequestDTO): Promise<FailTopupPaymentResponseDTO>;
}
