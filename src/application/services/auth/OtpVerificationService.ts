import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IOtpService } from "../../interface/services/IOtpService";
import {
  IOtpSessionService,
  OtpSessionData,
} from "../../interface/services/IOtpSessionService";

/**
 * Validates OTP codes against active OTP sessions, enforces attempt limits,
 * and deletes consumed OTP sessions.
 */
export class OtpVerificationService {
  private static readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly otpSessionService: IOtpSessionService,
    private readonly otpService: IOtpService
  ) {}

  async verify(params: {
    email: string;
    otp: string;
    expectedPurpose?: "RESET_PASSWORD";
  }): Promise<OtpSessionData | undefined> {
    const { email, otp, expectedPurpose } = params;
    const record = await this.otpSessionService.get(email);

    if (!record) {
      throw new AppError(ErrorCodes.OTP_EXPIRED);
    }

    if (expectedPurpose && record.data?.purpose !== expectedPurpose) {
      throw new AppError(ErrorCodes.OTP_EXPIRED);
    }

    if (record.attempts >= OtpVerificationService.MAX_ATTEMPTS) {
      throw new AppError(ErrorCodes.OTP_TOO_MANY_ATTEMPTS);
    }

    const isValid = await this.otpService.compare(otp, record.otpHash);
    if (!isValid) {
      await this.otpSessionService.incrementAttempts(email);
      throw new AppError(ErrorCodes.OTP_INVALID);
    }

    return record.data;
  }

  async consume(email: string): Promise<void> {
    await this.otpSessionService.delete(email);
  }
}
