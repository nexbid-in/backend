import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { ResendOtpDTO } from "../../dto/auth/RegisterDTO";
import { IOtpSessionService } from "../../interface/services/IOtpSessionService";
import { IResendOtpUseCase } from "../../interface/use-cases/auth/IResendOtpUseCase";
import { OtpDispatchService } from "../../services/auth/OtpDispatchService";

/**
 * Orchestrates resending a registration OTP for an existing active OTP session.
 */
export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    private readonly _otpSessionService: IOtpSessionService,
    private readonly _otpDispatchService: OtpDispatchService
  ) {}

  async execute(input: ResendOtpDTO): Promise<void> {
    const email = Email.create(input.email).getValue();

    await this._otpDispatchService.checkRateLimit(
      `rate_limit:otp:${email}`,
      5,
      900
    );

    const existingRecord = await this._otpSessionService.get(email);
    if (!existingRecord) {
      throw new AppError(ErrorCodes.OTP_EXPIRED);
    }

    await this._otpDispatchService.generateAndSendOtp({
      email,
      subject: "Your nexbid Registration OTP Code (Resent)",
      sessionData: existingRecord.data,
    });
  }
}
